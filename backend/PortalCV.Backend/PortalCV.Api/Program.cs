using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.OpenApi.Models;
using PortalCV.Api.Json;
using PortalCV.Api.Middleware;
using PortalCV.Infrastructure;
using PortalCV.Infrastructure.Data;
using Serilog;

namespace PortalCV.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Host.UseSerilog((context, services, loggerConfiguration) =>
            {
                loggerConfiguration
                    .ReadFrom.Configuration(context.Configuration)
                    .ReadFrom.Services(services)
                    .Enrich.FromLogContext()
                    .WriteTo.Console();
            });

            builder.Services.AddInfrastructure(builder.Configuration);

            // CORS: en producción hay que definir Cors:AllowedOrigins (p. ej. URL del SPA).
            // Variables de entorno: Cors__AllowedOrigins__0, Cors__AllowedOrigins__1, …
            // En Development, si la lista está vacía se usan orígenes locales típicos (ng serve / puertos locales).
            var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
            var corsOrigins = configuredOrigins?
                .Where(static o => !string.IsNullOrWhiteSpace(o))
                .Select(static o => o.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray() ?? [];

            if (corsOrigins.Length == 0)
            {
                if (builder.Environment.IsDevelopment())
                {
                    corsOrigins =
                    [
                        "http://localhost:4200",
                        "http://localhost:3000",
                    ];
                }
                else
                {
                    throw new InvalidOperationException(
                        "Cors:AllowedOrigins debe contener al menos un origen HTTPS en producción " +
                        "(por ejemplo la URL pública del frontend). " +
                        "Use variables Cors__AllowedOrigins__0, Cors__AllowedOrigins__1, etc.");
                }
            }

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", corsBuilder =>
                {
                    corsBuilder
                        .WithOrigins(corsOrigins)
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            });

            builder.Services.AddControllers()
                .AddJsonOptions(o =>
                {
                    o.JsonSerializerOptions.Converters.Add(new UtcDateTimeJsonConverter());
                    o.JsonSerializerOptions.Converters.Add(new UtcNullableDateTimeJsonConverter());
                });
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                // Evita colisiones de nombres de esquema (varios DTOs con el mismo nombre corto).
                options.CustomSchemaIds(type => type.FullName?.Replace("+", ".") ?? type.Name);

                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "PortalCV API",
                    Version = "v1"
                });

                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.ApiKey,
                    In = ParameterLocation.Header,
                    Description = "JWT Authorization header usando el esquema Bearer. Ejemplo: \"Bearer {token}\""
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            var jwtSection = builder.Configuration.GetSection("Jwt");
            var jwtKey = jwtSection["Key"]
                ?? throw new InvalidOperationException("Jwt:Key no está configurado.");
            if (string.IsNullOrWhiteSpace(jwtKey))
            {
                throw new InvalidOperationException("Jwt:Key no puede estar vacío.");
            }

            var jwtIssuer = jwtSection["Issuer"];
            var jwtAudience = jwtSection["Audience"];
            if (string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
            {
                throw new InvalidOperationException("Jwt:Issuer y Jwt:Audience son obligatorios.");
            }

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

            builder.Services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwtIssuer,
                        ValidAudience = jwtAudience,
                        IssuerSigningKey = signingKey,
                        ClockSkew = TimeSpan.Zero
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            string? token = null;

                            // Swagger UI (según esquema de seguridad) puede enviar Authorization
                            // sin prefijo "Bearer ". Si parece un JWT, lo aceptamos igual.
                            var authHeader = context.Request.Headers.Authorization.ToString();
                            if (!string.IsNullOrWhiteSpace(authHeader))
                            {
                                const string bearerPrefix = "Bearer ";
                                if (authHeader.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase))
                                {
                                    token = authHeader[bearerPrefix.Length..].Trim();
                                }
                                else if (authHeader.Count(static c => c == '.') == 2)
                                {
                                    token = authHeader.Trim();
                                }
                            }

                            // El SPA ya no recibe el JWT en el body ni lo guarda en localStorage:
                            // viaja como cookie HttpOnly (ver AuthController.SetAuthCookie). Si no
                            // hay header Authorization utilizable, se cae a la cookie.
                            if (string.IsNullOrWhiteSpace(token) &&
                                context.Request.Cookies.TryGetValue(
                                    PortalCV.Application.Constants.AuthCookieDefaults.Name, out var cookieToken) &&
                                !string.IsNullOrWhiteSpace(cookieToken))
                            {
                                token = cookieToken;
                            }

                            if (!string.IsNullOrWhiteSpace(token))
                            {
                                context.Token = token;
                            }

                            return Task.CompletedTask;
                        }
                    };
                });

            builder.Services.AddAuthorization();

            builder.Services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.OnRejected = async (context, token) =>
                {
                    context.HttpContext.Response.ContentType = "application/json";
                    await context.HttpContext.Response.WriteAsync(
                        "{\"message\":\"Demasiadas solicitudes. Intenta de nuevo en unos minutos.\",\"statusCode\":429}",
                        token);
                };

                options.AddFixedWindowLimiter("auth-public", limiter =>
                {
                    limiter.PermitLimit = 10;
                    limiter.Window = TimeSpan.FromMinutes(1);
                    limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                    limiter.QueueLimit = 0;
                    limiter.AutoReplenishment = true;
                });

                options.AddFixedWindowLimiter("contact-public", limiter =>
                {
                    limiter.PermitLimit = 5;
                    limiter.Window = TimeSpan.FromMinutes(1);
                    limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                    limiter.QueueLimit = 0;
                    limiter.AutoReplenishment = true;
                });
            });

            // Health checks:
            // - /health: liveness basico (la API responde; sin dependencias externas).
            // - /health/ready: readiness con conexion a SQL (Azure SQL puede tardar en despertar).
            builder.Services
                .AddHealthChecks()
                .AddDbContextCheck<PortalCvDbContext>("database");

            var app = builder.Build();

            // Detrás del ingress de Azure Container Apps la IP real del visitante viaja en
            // X-Forwarded-For; sin esto, HttpContext.Connection.RemoteIpAddress solo vería la
            // IP interna del proxy de la plataforma. KnownNetworks/KnownProxies se limpian
            // porque el proxy de Container Apps no tiene una IP fija conocida de antemano
            // (mismo patrón recomendado por Microsoft para apps detrás de un PaaS gestionado).
            var forwardedHeadersOptions = new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
            };
            forwardedHeadersOptions.KnownIPNetworks.Clear();
            forwardedHeadersOptions.KnownProxies.Clear();
            app.UseForwardedHeaders(forwardedHeadersOptions);

            app.UseMiddleware<GlobalExceptionMiddleware>();
            app.UseSerilogRequestLogging();

            app.UseCors("AllowFrontend");

            if (app.Environment.IsDevelopment())
            {
                // Swagger 2.0: máxima compatibilidad con Swagger UI (evita "valid version field" por caché o parsers viejos).
                app.UseSwagger(options =>
                {
                    options.OpenApiVersion = Microsoft.OpenApi.OpenApiSpecVersion.OpenApi2_0;
                });
                app.UseSwaggerUI(options =>
                {
                    // Query string para invalidar caché del swagger.json en el navegador.
                    options.SwaggerEndpoint("v1/swagger.json?api=v2", "PortalCV API v1");
                });
            }

            // En desarrollo suele usarse el perfil "http" (solo :5005). UseHttpsRedirection()
            // redirige a HTTPS y el navegador puede terminar en un puerto sin listener, o el
            // usuario abre https:// en un puerto que solo sirve HTTP → "invalid response".
            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            app.UseRateLimiter();
            app.UseAuthentication();
            app.UseAuthorization();

            if (app.Environment.IsDevelopment())
            {
                app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
            }

            // Endpoint de health publico (no requiere JWT). Azure Container Apps lo
            // usa como liveness probe y curl lo usa como smoke test post-deploy.
            app.MapHealthChecks("/health").AllowAnonymous();
            app.MapHealthChecks("/health/ready", new HealthCheckOptions
            {
                Predicate = r => r.Name == "database",
            }).AllowAnonymous();

            app.MapControllers();

            app.Run();
        }
    }
}
