using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests de integracion de POST /api/cv/ofertas/seleccionar-perfil (Fase 3 del flujo de
/// Ofertas). Mismo patron que OfertaAnalisisEndpointTests: reemplaza IAiProviderClient
/// por un doble de prueba via WithWebHostBuilder, nunca llama a un proveedor real.
/// </summary>
public class PerfilSeleccionEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions CamelCase = new(JsonSerializerDefaults.Web);

    public PerfilSeleccionEndpointTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private sealed class FakeAiProviderClient : IAiProviderClient
    {
        public string Proveedor { get; }
        public bool Ok { get; set; } = true;
        public string? Texto { get; set; }
        public string? Error { get; set; }
        public string? UltimoPromptRecibido { get; private set; }

        public FakeAiProviderClient(string proveedor) => Proveedor = proveedor;

        public Task<(bool Ok, string Mensaje)> ProbarConexionAsync(
            string? modelo, string? endpoint, string? apiKey, CancellationToken ct = default)
            => Task.FromResult((true, "ok"));

        public Task<(bool Ok, string? Texto, string? Error)> GenerarTextoAsync(
            string? modelo, string? endpoint, string? apiKey, string prompt,
            byte[]? imagenBytes, string? imagenContentType, CancellationToken ct = default)
        {
            UltimoPromptRecibido = prompt;
            return Task.FromResult((Ok, Texto, Error));
        }
    }

    private async Task<(HttpClient Client, int CurriculumId)> CreateClientAsync(
        string emailPrefix, FakeAiProviderClient? clienteFalso)
    {
        var factory = _factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IAiProviderClient>();
            if (clienteFalso is not null)
                services.AddSingleton<IAiProviderClient>(clienteFalso);
        }));

        int usuarioId;
        int curriculumId;

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
            var usuario = new Usuario
            {
                Email = $"{emailPrefix}-{Guid.NewGuid():N}@example.com",
                PasswordHash = "no-se-usa-en-este-test",
                Estado = "Activo",
                FechaRegistro = DateTime.UtcNow,
            };
            var curriculum = new Curriculum
            {
                UrlPublica = $"cv-{Guid.NewGuid():N}",
                Estado = "Borrador",
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow,
                Usuario = usuario,
            };
            usuario.Curriculums.Add(curriculum);
            db.Usuarios.Add(usuario);
            await db.SaveChangesAsync();

            usuarioId = usuario.UsuarioId;
            curriculumId = curriculum.CurriculumId;
        }

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuarioId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, $"{emailPrefix}@example.com"),
            new Claim("curriculum_id", curriculumId.ToString()),
            new Claim(ClaimTypes.Role, "Publicador"),
        };
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestWebApplicationFactory.TestJwtKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var jwt = new JwtSecurityToken(
            issuer: TestWebApplicationFactory.TestJwtIssuer,
            audience: TestWebApplicationFactory.TestJwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: credentials);
        var token = new JwtSecurityTokenHandler().WriteToken(jwt);

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cookie", $"portalcv_auth={token}");
        return (client, curriculumId);
    }

    private static async Task AgregarProveedorActivoAsync(HttpClient client, string proveedor = "claude")
    {
        // El endpoint ahora es admin-only (config global de IA) -- se cambia
        // momentaneamente la cookie de auth del cliente Publicador por una de Admin
        // solo para esta llamada, y se restaura despues.
        var cookieOriginal = client.DefaultRequestHeaders.GetValues("Cookie").First();
        client.DefaultRequestHeaders.Remove("Cookie");
        client.DefaultRequestHeaders.Add("Cookie", $"portalcv_auth={CrearTokenAdmin()}");
        try
        {
            var response = await client.PostAsJsonAsync(
                "/api/admin/proveedor-ia",
                new { proveedor, nombre = (string?)null, modelo = (string?)null, endpoint = (string?)null, apiKey = "clave-de-prueba" },
                CamelCase);
            response.EnsureSuccessStatusCode();
        }
        finally
        {
            client.DefaultRequestHeaders.Remove("Cookie");
            client.DefaultRequestHeaders.Add("Cookie", cookieOriginal);
        }
    }

    private static string CrearTokenAdmin()
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, "0"),
            new Claim(JwtRegisteredClaimNames.Email, "admin-seed@example.com"),
            new Claim(ClaimTypes.Role, "Admin"),
        };
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestWebApplicationFactory.TestJwtKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var jwt = new JwtSecurityToken(
            issuer: TestWebApplicationFactory.TestJwtIssuer,
            audience: TestWebApplicationFactory.TestJwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }

    private static async Task<int> CrearPerfilAsync(HttpClient client, string nombre)
    {
        var response = await client.PostAsJsonAsync("/api/cv/perfiles", new
        {
            nombrePerfil = nombre,
            descripcionPerfil = (string?)null,
            experienciaPerfilAnios = (decimal?)null,
            aspiracionSalarialPesos = (decimal?)null,
            aspiracionSalarialDolares = (decimal?)null,
            esActivo = true,
        }, CamelCase);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("perfilId").GetInt32();
    }

    [Fact]
    public async Task SeleccionarPerfil_SinCargoOEmpresa_Devuelve400()
    {
        var (client, _) = await CreateClientAsync("selperfil-sinentrada", new FakeAiProviderClient("claude"));

        var response = await client.PostAsJsonAsync(
            "/api/cv/ofertas/seleccionar-perfil", new { cargo = "", empresa = "Acme", descripcion = (string?)null }, CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task SeleccionarPerfil_SinPerfilesGuardados_Devuelve400SinLlamarALaIa()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = "no debería usarse" };
        var (client, _) = await CreateClientAsync("selperfil-sinperfiles", fake);
        await AgregarProveedorActivoAsync(client);

        var response = await client.PostAsJsonAsync(
            "/api/cv/ofertas/seleccionar-perfil", new { cargo = "Dev", empresa = "Acme", descripcion = (string?)null }, CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Null(fake.UltimoPromptRecibido);
    }

    [Fact]
    public async Task SeleccionarPerfil_ConUnSoloPerfil_LoDevuelveSinLlamarALaIa()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = "no debería usarse" };
        var (client, _) = await CreateClientAsync("selperfil-unsolo", fake);
        await AgregarProveedorActivoAsync(client);
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");

        var response = await client.PostAsJsonAsync(
            "/api/cv/ofertas/seleccionar-perfil", new { cargo = "Dev", empresa = "Acme", descripcion = (string?)null }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(perfilId, dto.GetProperty("perfilId").GetInt32());
        Assert.Equal("Backend .NET", dto.GetProperty("perfilNombre").GetString());
        Assert.Null(fake.UltimoPromptRecibido);
    }

    [Fact]
    public async Task SeleccionarPerfil_ConVariosPerfilesYLaIaSugiereUnoValido_DevuelveEsePerfil()
    {
        // El fake se registra desde CreateClientAsync (una sola factory/cliente), y su
        // Texto se actualiza despues de crear los perfiles, una vez conocido el Id real.
        var fake = new FakeAiProviderClient("claude") { Ok = true };
        var (client, _) = await CreateClientAsync("selperfil-valido", fake);
        await AgregarProveedorActivoAsync(client);
        await CrearPerfilAsync(client, "Arquitecto de Datos");
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");
        fake.Texto = $"{{\"perfilId\":{perfilId},\"razon\":\"Coincide en tecnologia\"}}";

        var response = await client.PostAsJsonAsync(
            "/api/cv/ofertas/seleccionar-perfil", new { cargo = "Desarrollador .NET", empresa = "Acme", descripcion = (string?)null }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(perfilId, dto.GetProperty("perfilId").GetInt32());
        Assert.Equal("Backend .NET", dto.GetProperty("perfilNombre").GetString());
        Assert.Contains("Desarrollador .NET", fake.UltimoPromptRecibido);
    }

    [Fact]
    public async Task SeleccionarPerfil_ConVariosPerfilesYLaIaSugiereUnIdInexistente_CaeAlPrimerPerfil()
    {
        var fake = new FakeAiProviderClient("claude")
        {
            Ok = true,
            Texto = "{\"perfilId\":999999,\"razon\":\"x\"}",
        };
        var (client, _) = await CreateClientAsync("selperfil-idinexistente", fake);
        await AgregarProveedorActivoAsync(client);
        var primerPerfilId = await CrearPerfilAsync(client, "Backend .NET");
        await CrearPerfilAsync(client, "Arquitecto de Datos");

        var response = await client.PostAsJsonAsync(
            "/api/cv/ofertas/seleccionar-perfil", new { cargo = "Dev", empresa = "Acme", descripcion = (string?)null }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(primerPerfilId, dto.GetProperty("perfilId").GetInt32());
    }

    [Fact]
    public async Task SeleccionarPerfil_ConVariosPerfilesYSinProveedorActivo_Devuelve400()
    {
        var (client, _) = await CreateClientAsync("selperfil-sinproveedor", new FakeAiProviderClient("claude"));
        await CrearPerfilAsync(client, "Backend .NET");
        await CrearPerfilAsync(client, "Arquitecto de Datos");

        var response = await client.PostAsJsonAsync(
            "/api/cv/ofertas/seleccionar-perfil", new { cargo = "Dev", empresa = "Acme", descripcion = (string?)null }, CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
