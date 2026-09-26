using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
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
/// Tests de integracion de POST /api/cv/perfiles/generar-ia -- genera con IA un borrador
/// de Nombre + Descripcion de perfil a partir de un enfoque corto y el curriculum real.
/// Mismo patron que los demas endpoints de IA: reemplaza IAiProviderClient por un doble
/// de prueba via WithWebHostBuilder, nunca llama a un proveedor real.
/// </summary>
public class PerfilGeneracionEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions CamelCase = new(JsonSerializerDefaults.Web);
    private const string RespuestaValida =
        "{\"nombrePerfil\":\"Arquitecto de Datos\",\"descripcionPerfil\":\"Ingeniero con experiencia en bodegas de datos y ETL.\"}";

    public PerfilGeneracionEndpointTests(TestWebApplicationFactory factory)
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

    private WebApplicationFactory<PortalCV.Api.Program> CreateFactory(FakeAiProviderClient? clienteFalso)
        => _factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IAiProviderClient>();
            if (clienteFalso is not null)
                services.AddSingleton<IAiProviderClient>(clienteFalso);
        }));

    private async Task<(HttpClient Client, int CurriculumId)> CreateClientAsync(
        string emailPrefix, FakeAiProviderClient? clienteFalso)
        => await AuthenticateAsync(CreateFactory(clienteFalso), emailPrefix);

    private async Task<(HttpClient Client, int CurriculumId)> AuthenticateAsync(
        WebApplicationFactory<PortalCV.Api.Program> factory, string emailPrefix)
    {
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

    [Fact]
    public async Task GenerarConIa_ConEnfoqueYProveedorActivo_DevuelveElBorrador()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = RespuestaValida };
        var (client, _) = await CreateClientAsync("perfilgen-ok", fake);
        await AgregarProveedorActivoAsync(client);

        var response = await client.PostAsJsonAsync(
            "/api/cv/perfiles/generar-ia", new { enfoque = "Arquitecto de Datos" }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Arquitecto de Datos", dto.GetProperty("nombrePerfil").GetString());
        Assert.Equal("Ingeniero con experiencia en bodegas de datos y ETL.", dto.GetProperty("descripcionPerfil").GetString());
        Assert.Contains("Arquitecto de Datos", fake.UltimoPromptRecibido);
    }

    [Fact]
    public async Task GenerarConIa_SinEnfoque_Devuelve400()
    {
        var (client, _) = await CreateClientAsync("perfilgen-sinenfoque", new FakeAiProviderClient("claude"));
        await AgregarProveedorActivoAsync(client);

        var response = await client.PostAsJsonAsync(
            "/api/cv/perfiles/generar-ia", new { enfoque = "" }, CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GenerarConIa_SinProveedorActivo_Devuelve400()
    {
        var (client, _) = await CreateClientAsync("perfilgen-sinproveedor", new FakeAiProviderClient("claude"));

        var response = await client.PostAsJsonAsync(
            "/api/cv/perfiles/generar-ia", new { enfoque = "Arquitecto de Datos" }, CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GenerarConIa_IncluyeElCurriculumRealEnElPrompt()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = RespuestaValida };
        var factory = CreateFactory(fake);
        var (client, curriculumId) = await AuthenticateAsync(factory, "perfilgen-curriculum");
        await AgregarProveedorActivoAsync(client);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
            db.Experiencias.Add(new Experiencia
            {
                CurriculumId = curriculumId, Empresa = "EmpresaDeCurriculumReal", Cargo = "Ingeniero de Datos",
                MostrarEnCv = true, FechaRegistro = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        var response = await client.PostAsJsonAsync(
            "/api/cv/perfiles/generar-ia", new { enfoque = "Arquitecto de Datos" }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("EmpresaDeCurriculumReal", fake.UltimoPromptRecibido);
    }

    [Fact]
    public async Task GenerarConIa_RecortaCamposDeTextoLibreMuyLargos()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = RespuestaValida };
        var factory = CreateFactory(fake);
        var (client, curriculumId) = await AuthenticateAsync(factory, "perfilgen-recorte");
        await AgregarProveedorActivoAsync(client);

        var funcionesLargas = new string('x', 5000);
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
            db.Experiencias.Add(new Experiencia
            {
                CurriculumId = curriculumId, Empresa = "EmpresaConFuncionesLargas", Cargo = "Ingeniero",
                Funciones = funcionesLargas, MostrarEnCv = true, FechaRegistro = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        var response = await client.PostAsJsonAsync(
            "/api/cv/perfiles/generar-ia", new { enfoque = "Arquitecto de Datos" }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var prompt = fake.UltimoPromptRecibido!;
        Assert.Contains("EmpresaConFuncionesLargas", prompt);
        Assert.DoesNotContain(funcionesLargas, prompt);
    }

    private const string RespuestaSugerenciasValida =
        "{\"sugerencias\":[" +
        "{\"nombre\":\"Arquitecto de Datos\",\"razon\":\"Varios proyectos de ETL y bodegas de datos.\"}," +
        "{\"nombre\":\"Backend .NET\",\"razon\":\"Experiencia reciente con C# y SQL Server.\"}]}";

    [Fact]
    public async Task SugerirEnfoques_ConProveedorActivo_DevuelveLasSugerencias()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = RespuestaSugerenciasValida };
        var (client, _) = await CreateClientAsync("perfilsug-ok", fake);
        await AgregarProveedorActivoAsync(client);

        var response = await client.PostAsync("/api/cv/perfiles/sugerir-enfoques", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var sugerencias = dto.GetProperty("sugerencias");
        Assert.Equal(2, sugerencias.GetArrayLength());
        Assert.Equal("Arquitecto de Datos", sugerencias[0].GetProperty("nombre").GetString());
        Assert.Equal("Varios proyectos de ETL y bodegas de datos.", sugerencias[0].GetProperty("razon").GetString());
    }

    [Fact]
    public async Task SugerirEnfoques_SinProveedorActivo_Devuelve400()
    {
        var (client, _) = await CreateClientAsync("perfilsug-sinproveedor", new FakeAiProviderClient("claude"));

        var response = await client.PostAsync("/api/cv/perfiles/sugerir-enfoques", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task SugerirEnfoques_ExcluyeNombresDePerfilesQueYaExisten()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = RespuestaSugerenciasValida };
        var factory = CreateFactory(fake);
        var (client, curriculumId) = await AuthenticateAsync(factory, "perfilsug-duplicado");
        await AgregarProveedorActivoAsync(client);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
            db.Perfiles.Add(new Perfil { CurriculumId = curriculumId, NombrePerfil = "arquitecto DE datos", EsActivo = true });
            await db.SaveChangesAsync();
        }

        var response = await client.PostAsync("/api/cv/perfiles/sugerir-enfoques", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var sugerencias = dto.GetProperty("sugerencias");
        Assert.Equal(1, sugerencias.GetArrayLength());
        Assert.Equal("Backend .NET", sugerencias[0].GetProperty("nombre").GetString());
        Assert.Contains("arquitecto DE datos", fake.UltimoPromptRecibido, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task SugerirEnfoques_IncluyeElCurriculumRealEnElPrompt()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = RespuestaSugerenciasValida };
        var factory = CreateFactory(fake);
        var (client, curriculumId) = await AuthenticateAsync(factory, "perfilsug-curriculum");
        await AgregarProveedorActivoAsync(client);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
            db.Experiencias.Add(new Experiencia
            {
                CurriculumId = curriculumId, Empresa = "EmpresaDeCurriculumRealSug", Cargo = "Ingeniero de Datos",
                MostrarEnCv = true, FechaRegistro = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        var response = await client.PostAsync("/api/cv/perfiles/sugerir-enfoques", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("EmpresaDeCurriculumRealSug", fake.UltimoPromptRecibido);
    }
}
