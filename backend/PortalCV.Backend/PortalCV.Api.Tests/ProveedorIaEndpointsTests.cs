using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using PortalCV.Application.Interfaces;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests de integracion de api/admin/proveedor-ia: UNA sola conexion de IA GLOBAL para
/// toda la plataforma (Claude/OpenAI/Gemini/Ollama/otro), administrada exclusivamente
/// por el rol Admin (ya no hay "dueño" por CV). Verifica que la clave de API se persiste
/// cifrada (nunca en texto plano) y nunca se devuelve al cliente, y que un no-Admin no
/// puede tocar nada de esto. Cada test corre contra una base InMemory propia y aislada
/// (WithWebHostBuilder genera un nombre de base nuevo por factory), asi que no hace falta
/// filtrar filas por CV como antes -- la tabla es global pero cada test parte de cero.
/// </summary>
public class ProveedorIaEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions CamelCase = new(JsonSerializerDefaults.Web);

    public ProveedorIaEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private (Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program> Factory, HttpClient AdminClient) CreateFactoryWithAdminClient()
    {
        var factory = _factory.WithWebHostBuilder(_ => { });
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cookie", $"portalcv_auth={CrearToken("admin-test", "Admin", curriculumId: null)}");
        return (factory, client);
    }

    private static string CrearToken(string emailPrefix, string rol, int? curriculumId)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, "1"),
            new(JwtRegisteredClaimNames.Email, $"{emailPrefix}@example.com"),
            new(ClaimTypes.Role, rol),
        };
        if (curriculumId is not null)
            claims.Add(new Claim("curriculum_id", curriculumId.Value.ToString()));

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

    private static object CrearBody(string proveedor, string? nombre = null, string? modelo = null, string? endpoint = null, string? apiKey = "clave-de-prueba") =>
        new { proveedor, nombre, modelo, endpoint, apiKey };

    [Fact]
    public async Task GetAll_SinConexionesGuardadas_DevuelveListaVacia()
    {
        var (_, client) = CreateFactoryWithAdminClient();

        var response = await client.GetAsync("/api/admin/proveedor-ia");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("[]", (await response.Content.ReadAsStringAsync()).Trim());
    }

    [Fact]
    public async Task GetAll_SinAutenticacion_Retorna401()
    {
        var (factory, _) = CreateFactoryWithAdminClient();
        var anonimo = factory.CreateClient();

        var response = await anonimo.GetAsync("/api/admin/proveedor-ia");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_ComoPublicador_Retorna403()
    {
        var (factory, _) = CreateFactoryWithAdminClient();
        var publicador = factory.CreateClient();
        publicador.DefaultRequestHeaders.Add("Cookie", $"portalcv_auth={CrearToken("publicador-test", "Publicador", curriculumId: 1)}");

        var response = await publicador.GetAsync("/api/admin/proveedor-ia");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Crear_PrimeraConexion_QuedaActivaYLaClaveSePersisteCifrada()
    {
        var (factory, client) = CreateFactoryWithAdminClient();
        const string apiKey = "sk-ant-super-secreta-123";

        var response = await client.PostAsJsonAsync(
            "/api/admin/proveedor-ia", CrearBody("claude", nombre: "Cuenta de la plataforma", modelo: "claude-opus-4-20250514", apiKey: apiKey), CamelCase);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain(apiKey, body);
        Assert.DoesNotContain("apiKey", body, StringComparison.OrdinalIgnoreCase);

        var dto = JsonDocument.Parse(body).RootElement;
        Assert.Equal("claude", dto.GetProperty("proveedor").GetString());
        Assert.Equal("Cuenta de la plataforma", dto.GetProperty("nombre").GetString());
        Assert.True(dto.GetProperty("esActivo").GetBoolean());

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var cipher = scope.ServiceProvider.GetRequiredService<IApiKeyCipher>();
        var fila = await db.ProveedoresIa.AsNoTracking().SingleAsync();

        Assert.NotNull(fila.ApiKeyCifrada);
        Assert.NotEqual(apiKey, fila.ApiKeyCifrada);
        Assert.Equal(apiKey, cipher.Decrypt(fila.ApiKeyCifrada!));
    }

    [Fact]
    public async Task Crear_ComoPublicador_Retorna403()
    {
        var (factory, _) = CreateFactoryWithAdminClient();
        var publicador = factory.CreateClient();
        publicador.DefaultRequestHeaders.Add("Cookie", $"portalcv_auth={CrearToken("publicador-crear", "Publicador", curriculumId: 1)}");

        var response = await publicador.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("claude"), CamelCase);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Crear_SegundaConexion_NoQuedaActivaAutomaticamente()
    {
        var (factory, client) = CreateFactoryWithAdminClient();
        await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("claude"), CamelCase);

        var response = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("openai"), CamelCase);

        var dto = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.False(dto.GetProperty("esActivo").GetBoolean());

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var activas = await db.ProveedoresIa.CountAsync(p => p.EsActivo);
        Assert.Equal(1, activas);
    }

    [Fact]
    public async Task Crear_SinApiKeyParaClaude_Retorna400()
    {
        var (_, client) = CreateFactoryWithAdminClient();

        var response = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("claude", apiKey: ""), CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Crear_OllamaSinEndpoint_Retorna400()
    {
        var (_, client) = CreateFactoryWithAdminClient();

        var response = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("ollama", apiKey: null), CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Crear_OllamaConEndpointYSinApiKey_Permitido()
    {
        var (_, client) = CreateFactoryWithAdminClient();

        var response = await client.PostAsJsonAsync(
            "/api/admin/proveedor-ia", CrearBody("ollama", endpoint: "http://localhost:11434", apiKey: null), CamelCase);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var dto = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("http://localhost:11434", dto.GetProperty("endpoint").GetString());
    }

    [Fact]
    public async Task Crear_ConProveedorInvalido_Retorna400()
    {
        var (_, client) = CreateFactoryWithAdminClient();

        var response = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("no-existe"), CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Actualizar_SinApiKey_MantieneLaClaveAnterior()
    {
        var (factory, client) = CreateFactoryWithAdminClient();
        const string apiKeyOriginal = "clave-original-123";
        var creado = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("claude", apiKey: apiKeyOriginal), CamelCase);
        var id = JsonDocument.Parse(await creado.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();

        var response = await client.PutAsJsonAsync(
            $"/api/admin/proveedor-ia/{id}", new { proveedor = "claude", nombre = (string?)null, modelo = "modelo-nuevo", endpoint = (string?)null, apiKey = (string?)null }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var cipher = scope.ServiceProvider.GetRequiredService<IApiKeyCipher>();
        var fila = await db.ProveedoresIa.AsNoTracking().SingleAsync();
        Assert.Equal(apiKeyOriginal, cipher.Decrypt(fila.ApiKeyCifrada!));
        Assert.Equal("modelo-nuevo", fila.Modelo);
    }

    [Fact]
    public async Task Actualizar_ConNuevaApiKey_LaReemplaza()
    {
        var (factory, client) = CreateFactoryWithAdminClient();
        var creado = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("claude", apiKey: "clave-vieja"), CamelCase);
        var id = JsonDocument.Parse(await creado.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();

        await client.PutAsJsonAsync(
            $"/api/admin/proveedor-ia/{id}", new { proveedor = "claude", nombre = (string?)null, modelo = (string?)null, endpoint = (string?)null, apiKey = "clave-nueva" }, CamelCase);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var cipher = scope.ServiceProvider.GetRequiredService<IApiKeyCipher>();
        var fila = await db.ProveedoresIa.AsNoTracking().SingleAsync();
        Assert.Equal("clave-nueva", cipher.Decrypt(fila.ApiKeyCifrada!));
    }

    [Fact]
    public async Task Actualizar_Inexistente_Retorna404()
    {
        var (_, client) = CreateFactoryWithAdminClient();

        var response = await client.PutAsJsonAsync(
            "/api/admin/proveedor-ia/999999", new { proveedor = "claude", nombre = (string?)null, modelo = (string?)null, endpoint = (string?)null, apiKey = "clave" }, CamelCase);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Eliminar_LaActiva_ActivaAutomaticamenteOtra()
    {
        var (factory, client) = CreateFactoryWithAdminClient();
        var primera = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("claude"), CamelCase);
        var primeraId = JsonDocument.Parse(await primera.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();
        await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("openai"), CamelCase);

        var deleteResponse = await client.DeleteAsync($"/api/admin/proveedor-ia/{primeraId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var restante = await db.ProveedoresIa.AsNoTracking().SingleAsync();
        Assert.Equal("openai", restante.Proveedor);
        Assert.True(restante.EsActivo);
    }

    [Fact]
    public async Task Eliminar_LaUnica_DejaLaListaVacia()
    {
        var (_, client) = CreateFactoryWithAdminClient();
        var creado = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("claude"), CamelCase);
        var id = JsonDocument.Parse(await creado.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();

        var deleteResponse = await client.DeleteAsync($"/api/admin/proveedor-ia/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await client.GetAsync("/api/admin/proveedor-ia");
        Assert.Equal("[]", (await getResponse.Content.ReadAsStringAsync()).Trim());
    }

    [Fact]
    public async Task Activar_CambiaCualEsLaActivaYSoloDejaUna()
    {
        var (factory, client) = CreateFactoryWithAdminClient();
        var primera = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("claude"), CamelCase);
        var primeraId = JsonDocument.Parse(await primera.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();
        var segunda = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("openai"), CamelCase);
        var segundaId = JsonDocument.Parse(await segunda.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();

        var response = await client.PutAsync($"/api/admin/proveedor-ia/{segundaId}/activar", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.True(dto.GetProperty("esActivo").GetBoolean());

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var filas = await db.ProveedoresIa.AsNoTracking().ToListAsync();
        Assert.Single(filas, p => p.EsActivo);
        Assert.True(filas.Single(p => p.ProveedorIaId == segundaId).EsActivo);
        Assert.False(filas.Single(p => p.ProveedorIaId == primeraId).EsActivo);
    }

    [Fact]
    public async Task Activar_LaDeMenorIdMientrasOtraDeMayorIdEstaActiva_NoFallaPorElIndiceUnico()
    {
        // Regresion: activar la fila de MENOR id mientras la de MAYOR id esta activa
        // reproducia "Cannot insert duplicate key row ... UQ_ProveedorIa_Activo" -- EF
        // Core no garantiza que el UPDATE de "desactivar" salga antes que el de
        // "activar" dentro de un mismo SaveChanges cuando el orden por id no coincide.
        var (factory, client) = CreateFactoryWithAdminClient();
        var primera = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("claude"), CamelCase);
        var primeraId = JsonDocument.Parse(await primera.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();
        var segunda = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("openai"), CamelCase);
        var segundaId = JsonDocument.Parse(await segunda.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();
        await client.PutAsync($"/api/admin/proveedor-ia/{segundaId}/activar", null); // ahora la de mayor id (segundaId) esta activa

        var response = await client.PutAsync($"/api/admin/proveedor-ia/{primeraId}/activar", null); // reactivar la de menor id

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var filas = await db.ProveedoresIa.AsNoTracking().ToListAsync();
        Assert.Single(filas, p => p.EsActivo);
        Assert.True(filas.Single(p => p.ProveedorIaId == primeraId).EsActivo);
    }

    [Fact]
    public async Task Probar_ConProveedorSinSoporteRealTodavia_RespondeOkFalseSinFallar()
    {
        var (_, client) = CreateFactoryWithAdminClient();

        var response = await client.PostAsJsonAsync(
            "/api/admin/proveedor-ia/probar", new { proveedor = "openai", modelo = (string?)null, endpoint = (string?)null, apiKey = "clave" }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.False(dto.GetProperty("ok").GetBoolean());
    }

    [Fact]
    public async Task Probar_ClaudeSinApiKey_RespondeOkFalse()
    {
        var (_, client) = CreateFactoryWithAdminClient();

        var response = await client.PostAsJsonAsync(
            "/api/admin/proveedor-ia/probar", new { proveedor = "claude", modelo = (string?)null, endpoint = (string?)null, apiKey = (string?)null }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.False(dto.GetProperty("ok").GetBoolean());
    }

    [Fact]
    public async Task ProbarGuardada_ConProveedorSinSoporteRealTodavia_RespondeOkFalseSinFallar()
    {
        var (_, client) = CreateFactoryWithAdminClient();
        var creado = await client.PostAsJsonAsync("/api/admin/proveedor-ia", CrearBody("openai", apiKey: "clave"), CamelCase);
        var id = (await creado.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("proveedorIaId").GetInt32();

        var response = await client.PostAsync($"/api/admin/proveedor-ia/{id}/probar", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.False(dto.GetProperty("ok").GetBoolean());
    }

    [Fact]
    public async Task ProbarGuardada_Inexistente_Retorna404()
    {
        var (_, client) = CreateFactoryWithAdminClient();

        var response = await client.PostAsync("/api/admin/proveedor-ia/999999/probar", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
