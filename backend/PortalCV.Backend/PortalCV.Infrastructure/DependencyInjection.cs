using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;
using PortalCV.Infrastructure.Repositories;
using PortalCV.Infrastructure.Services;
using PortalCV.Infrastructure.Services.Email;

namespace PortalCV.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection no está configurado.");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("ConnectionStrings:DefaultConnection no puede estar vacío.");
        }

        services.AddDbContext<PortalCvDbContext>(options =>
            options
                .UseSqlServer(
                    connectionString,
                    sqlOptions => sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

        services.AddHttpContextAccessor();
        services.AddMemoryCache();

        // Repositorios genéricos
        services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));
        services.AddScoped<ICurriculumRepository, CurriculumRepository>();
        services.AddScoped<IPromptIaRepository, PromptIaRepository>();

        // Servicios de aplicación
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPublicCvVisitaRegistroService, PublicCvVisitaRegistroService>();
        services.AddScoped<IPublicCvService, PublicCvService>();
        services.AddScoped<ICvEditorService, CvEditorService>();
        services.AddScoped<IAlertaService, AlertaService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IPromptIaService, PromptIaService>();
        services.AddScoped<IAdminAuditoriaService, AdminAuditoriaService>();
        services.AddScoped<ICvAuditoriaService, CvAuditoriaService>();
        services.AddScoped<IAuthAuditoriaService, AuthAuditoriaService>();
        services.AddScoped<IProveedorIaService, ProveedorIaService>();
        services.AddScoped<IPromptEnsambladorService, PromptEnsambladorService>();
        services.AddScoped<IIaPromptInvoker, IaPromptInvoker>();
        services.AddScoped<IOfertaAnalisisService, OfertaAnalisisService>();
        services.AddScoped<IPerfilSeleccionService, PerfilSeleccionService>();
        services.AddScoped<IPerfilGeneracionService, PerfilGeneracionService>();
        services.AddScoped<ICvGeneradoService, CvGeneradoService>();
        services.AddScoped<IConfiguracionCorreoService, ConfiguracionCorreoService>();
        services.AddScoped<IEmailSender, MailKitEmailSender>();
        services.AddScoped<ICvPdfRendererService, CvPdfRendererService>();
        services.AddScoped<IOfertaEnvioService, OfertaEnvioService>();

        services.AddSingleton<IApiKeyCipher, AesGcmApiKeyCipher>();
        // Nombre explícito en cada registro: AddHttpClient<TClient, TImpl>() sin nombre usa
        // typeof(TClient).Name como clave del HttpClient -- como las tres implementaciones
        // comparten TClient=IAiProviderClient, sin un nombre propio colisionarían (ASP.NET
        // Core lanza InvalidOperationException la primera vez que se resuelve el segundo
        // TImplementation registrado bajo el mismo TClient).
        // Timeout 60s (no 10s): el mismo HttpClient sirve tanto la prueba de conexión
        // (1 token, rápida) como el análisis real de una oferta (GenerarTextoAsync),
        // que puede tardar bastante más -- sobre todo con una imagen adjunta.
        services.AddHttpClient<IAiProviderClient, ClaudeAiProviderClient>("ia-claude", client =>
        {
            client.BaseAddress = new Uri("https://api.anthropic.com/");
            client.Timeout = TimeSpan.FromSeconds(60);
        });
        services.AddHttpClient<IAiProviderClient, GeminiAiProviderClient>("ia-gemini", client =>
        {
            client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
            client.Timeout = TimeSpan.FromSeconds(60);
        });
        services.AddHttpClient<IAiProviderClient, GroqAiProviderClient>("ia-groq", client =>
        {
            client.BaseAddress = new Uri("https://api.groq.com/");
            client.Timeout = TimeSpan.FromSeconds(60);
        });
        services.AddHttpClient<IAiProviderClient, OllamaAiProviderClient>("ia-ollama", client =>
        {
            // Sin BaseAddress fija: cada conexión guardada trae su propio Endpoint
            // (Docker local, LAN, etc.), usado como URI absoluta en cada solicitud.
            // Timeout más alto que Claude/Gemini: un modelo local/self-hosted por CPU
            // (a veces detrás de un túnel como ngrok) puede tardar varios minutos en
            // generar una respuesta larga, a diferencia de una API en la nube.
            client.Timeout = TimeSpan.FromSeconds(300);
        });

        return services;
    }
}

