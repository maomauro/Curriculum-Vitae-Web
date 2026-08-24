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
/// Tests de integracion de POST /api/cv/perfiles/{id}/generar-cv y GET
/// /api/cv/cv-generado -- CV general generado por IA a partir de un Perfil, sin
/// oferta de por medio. Mismo patron que CvGeneradoEndpointTests: reemplaza
/// IAiProviderClient por un doble de prueba via WithWebHostBuilder.
/// </summary>
public class CvGeneradoEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions CamelCase = new(JsonSerializerDefaults.Web);
    private const string RespuestaValida =
        "{\"experiencia\":[{\"cabecera\":\"Backend .NET en Empresa X, 2020-2024\",\"funciones\":[\"Diseñé APIs REST\",\"Lideré migración a .NET 8\"]}]," +
        "\"educacion\":[\"Ingeniería de Sistemas -- Universidad Y (2015)\"],\"proyectos\":[\"Portal CV con IA\"]," +
        "\"habilidades\":[\"C#\",\"Angular\"]}";

    public CvGeneradoEndpointTests(TestWebApplicationFactory factory)
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
        var response = await client.PostAsJsonAsync(
            "/api/cv/proveedor-ia",
            new { proveedor, nombre = (string?)null, modelo = (string?)null, endpoint = (string?)null, apiKey = "clave-de-prueba" },
            CamelCase);
        response.EnsureSuccessStatusCode();
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
    public async Task GenerarCv_ConPerfilPropio_CreaElCv()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = RespuestaValida };
        var (client, _) = await CreateClientAsync("cvgenperfil-ok", fake);
        await AgregarProveedorActivoAsync(client);
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");

        var response = await client.PostAsync($"/api/cv/perfiles/{perfilId}/generar-cv", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(perfilId, dto.GetProperty("perfilId").GetInt32());
        Assert.Equal("Backend .NET", dto.GetProperty("perfilNombre").GetString());
        var contenido = dto.GetProperty("contenido");
        var experiencia = contenido.GetProperty("experiencia");
        Assert.Equal(1, experiencia.GetArrayLength());
        Assert.Equal("Backend .NET en Empresa X, 2020-2024", experiencia[0].GetProperty("cabecera").GetString());
        Assert.Equal(2, experiencia[0].GetProperty("funciones").GetArrayLength());
        Assert.Equal(1, contenido.GetProperty("educacion").GetArrayLength());
        Assert.Equal(1, contenido.GetProperty("proyectos").GetArrayLength());
        Assert.Equal(2, contenido.GetProperty("habilidades").GetArrayLength());
        Assert.DoesNotContain("OFERTA_JSON", fake.UltimoPromptRecibido);
    }

    [Fact]
    public async Task GenerarCv_ClasificaLasHabilidadesElegidasPorTipoRealDelCandidato()
    {
        var fake = new FakeAiProviderClient("claude")
        {
            Ok = true,
            Texto = "{\"experiencia\":[],\"educacion\":[],\"proyectos\":[],\"habilidades\":[\"C#\",\"Liderazgo\",\"Ingles\",\"HabilidadInexistente\"]}",
        };
        var factory = CreateFactory(fake);
        var (client, curriculumId) = await AuthenticateAsync(factory, "cvgenperfil-tipohabilidad");
        await AgregarProveedorActivoAsync(client);
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
            db.Habilidades.AddRange(
                new Habilidad { CurriculumId = curriculumId, Nombre = "C#", Tipo = "Tecnica", MostrarEnCv = true },
                new Habilidad { CurriculumId = curriculumId, Nombre = "Liderazgo", Tipo = "Blanda", MostrarEnCv = true },
                new Habilidad { CurriculumId = curriculumId, Nombre = "Ingles", Tipo = "Idioma", MostrarEnCv = true });
            await db.SaveChangesAsync();
        }

        var response = await client.PostAsync($"/api/cv/perfiles/{perfilId}/generar-cv", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var habilidades = (await response.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("contenido").GetProperty("habilidades");
        Assert.Equal(4, habilidades.GetArrayLength());
        var porNombre = habilidades.EnumerateArray()
            .ToDictionary(h => h.GetProperty("nombre").GetString()!, h => h.GetProperty("tipo"));
        Assert.Equal("Tecnica", porNombre["C#"].GetString());
        Assert.Equal("Blanda", porNombre["Liderazgo"].GetString());
        Assert.Equal("Idioma", porNombre["Ingles"].GetString());
        Assert.Equal(JsonValueKind.Null, porNombre["HabilidadInexistente"].ValueKind);
    }

    [Fact]
    public async Task GenerarCv_LlamadoDosVeces_ActualizaLaMismaFilaEnVezDeDuplicar()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = RespuestaValida };
        var (client, _) = await CreateClientAsync("cvgenperfil-regenerar", fake);
        await AgregarProveedorActivoAsync(client);
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");

        var primera = await client.PostAsync($"/api/cv/perfiles/{perfilId}/generar-cv", null);
        var idPrimera = (await primera.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("cvGeneradoId").GetInt32();

        fake.Texto = "{\"experiencia\":[],\"educacion\":[],\"proyectos\":[],\"habilidades\":[\"C#\"]}";
        var segunda = await client.PostAsync($"/api/cv/perfiles/{perfilId}/generar-cv", null);
        var dtoSegunda = await segunda.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(idPrimera, dtoSegunda.GetProperty("cvGeneradoId").GetInt32());
        Assert.Equal(1, dtoSegunda.GetProperty("contenido").GetProperty("habilidades").GetArrayLength());

        var lista = await client.GetFromJsonAsync<JsonElement>("/api/cv/cv-generado");
        Assert.Equal(1, lista.GetArrayLength());
    }

    [Fact]
    public async Task GenerarCv_ConPerfilDeOtroCurriculum_Devuelve403()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = RespuestaValida };
        var factory = CreateFactory(fake);
        var (clientA, _) = await AuthenticateAsync(factory, "cvgenperfil-ownerA");
        var perfilDeA = await CrearPerfilAsync(clientA, "Backend .NET");

        var (clientB, _) = await AuthenticateAsync(factory, "cvgenperfil-ownerB");
        await AgregarProveedorActivoAsync(clientB);

        var response = await clientB.PostAsync($"/api/cv/perfiles/{perfilDeA}/generar-cv", null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GenerarCv_ParaPerfilInexistente_Devuelve404()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = RespuestaValida };
        var (client, _) = await CreateClientAsync("cvgenperfil-inexistente", fake);
        await AgregarProveedorActivoAsync(client);

        var response = await client.PostAsync("/api/cv/perfiles/999999/generar-cv", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ListarCvGenerado_SinNingunoGenerado_DevuelveListaVacia()
    {
        var (client, _) = await CreateClientAsync("cvgenperfil-listavacia", new FakeAiProviderClient("claude"));

        var response = await client.GetAsync("/api/cv/cv-generado");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("[]", (await response.Content.ReadAsStringAsync()).Trim());
    }

    [Fact]
    public async Task EliminarPerfil_ConCvGeneradoAsociado_NoFallaYLoBorraTambien()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = RespuestaValida };
        var (client, _) = await CreateClientAsync("cvgenperfil-eliminarperfil", fake);
        await AgregarProveedorActivoAsync(client);
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");
        await client.PostAsync($"/api/cv/perfiles/{perfilId}/generar-cv", null);

        var response = await client.DeleteAsync($"/api/cv/perfiles/{perfilId}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var lista = await client.GetFromJsonAsync<JsonElement>("/api/cv/cv-generado");
        Assert.Equal(0, lista.GetArrayLength());
    }
}
