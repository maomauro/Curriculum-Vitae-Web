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
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests de integracion de api/cv/proveedor-ia: varias conexiones con proveedores de IA
/// por CV (Claude/OpenAI/Gemini/Ollama/otro), con exactamente una activa a la vez (mismo
/// patron EsActivo que PromptIa). Verifica que la clave de API se persiste cifrada
/// (nunca en texto plano) y nunca se devuelve al cliente. El endpoint "probar" solo se
/// ejercita con un proveedor sin soporte real (openai) para no depender de red externa —
/// Claude tiene su propio cliente HTTP real, probado aparte en ClaudeAiProviderClientTests
/// con un HttpMessageHandler falso.
/// </summary>
public class ProveedorIaEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions CamelCase = new(JsonSerializerDefaults.Web);

    public ProveedorIaEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>Devuelve tambien el CurriculumId creado: el fixture de la clase (y su base
    /// InMemory) se comparte entre todos los tests, asi que las aserciones que consultan
    /// PortalCvDbContext directamente (sin pasar por un endpoint ya filtrado por
    /// CurriculumId) deben filtrar por este id para no ver filas de otros tests.</summary>
    private async Task<(HttpClient Client, int CurriculumId)> CreateAuthenticatedClientAsync(string emailPrefix)
    {
        int usuarioId;
        int curriculumId;

        using (var scope = _factory.Services.CreateScope())
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

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cookie", $"portalcv_auth={token}");
        return (client, curriculumId);
    }

    private static object CrearBody(string proveedor, string? nombre = null, string? modelo = null, string? endpoint = null, string? apiKey = "clave-de-prueba") =>
        new { proveedor, nombre, modelo, endpoint, apiKey };

    [Fact]
    public async Task GetAll_SinConexionesGuardadas_DevuelveListaVacia()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("provia-vacio");

        var response = await client.GetAsync("/api/cv/proveedor-ia");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("[]", (await response.Content.ReadAsStringAsync()).Trim());
    }

    [Fact]
    public async Task Crear_PrimeraConexion_QuedaActivaYLaClaveSePersisteCifrada()
    {
        var (client, curriculumId) = await CreateAuthenticatedClientAsync("provia-crear");
        const string apiKey = "sk-ant-super-secreta-123";

        var response = await client.PostAsJsonAsync(
            "/api/cv/proveedor-ia", CrearBody("claude", nombre: "Cuenta personal", modelo: "claude-opus-4-20250514", apiKey: apiKey), CamelCase);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain(apiKey, body);
        Assert.DoesNotContain("apiKey", body, StringComparison.OrdinalIgnoreCase);

        var dto = JsonDocument.Parse(body).RootElement;
        Assert.Equal("claude", dto.GetProperty("proveedor").GetString());
        Assert.Equal("Cuenta personal", dto.GetProperty("nombre").GetString());
        Assert.True(dto.GetProperty("esActivo").GetBoolean());

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var cipher = scope.ServiceProvider.GetRequiredService<IApiKeyCipher>();
        var fila = await db.ProveedoresIa.AsNoTracking().SingleAsync(p => p.CurriculumId == curriculumId);

        Assert.NotNull(fila.ApiKeyCifrada);
        Assert.NotEqual(apiKey, fila.ApiKeyCifrada);
        Assert.Equal(apiKey, cipher.Decrypt(fila.ApiKeyCifrada!));
    }

    [Fact]
    public async Task Crear_SegundaConexion_NoQuedaActivaAutomaticamente()
    {
        var (client, curriculumId) = await CreateAuthenticatedClientAsync("provia-segunda");
        await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude"), CamelCase);

        var response = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("openai"), CamelCase);

        var dto = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.False(dto.GetProperty("esActivo").GetBoolean());

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var activas = await db.ProveedoresIa.CountAsync(p => p.CurriculumId == curriculumId && p.EsActivo);
        Assert.Equal(1, activas);
    }

    [Fact]
    public async Task Crear_SinApiKeyParaClaude_Retorna400()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("provia-sinkey");

        var response = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude", apiKey: ""), CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Crear_OllamaSinEndpoint_Retorna400()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("provia-ollama-sinurl");

        var response = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("ollama", apiKey: null), CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Crear_OllamaConEndpointYSinApiKey_Permitido()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("provia-ollama-ok");

        var response = await client.PostAsJsonAsync(
            "/api/cv/proveedor-ia", CrearBody("ollama", endpoint: "http://localhost:11434", apiKey: null), CamelCase);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var dto = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("http://localhost:11434", dto.GetProperty("endpoint").GetString());
    }

    [Fact]
    public async Task Crear_ConProveedorInvalido_Retorna400()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("provia-invalido");

        var response = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("no-existe"), CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Actualizar_SinApiKey_MantieneLaClaveAnterior()
    {
        var (client, curriculumId) = await CreateAuthenticatedClientAsync("provia-mantiene-clave");
        const string apiKeyOriginal = "clave-original-123";
        var creado = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude", apiKey: apiKeyOriginal), CamelCase);
        var id = JsonDocument.Parse(await creado.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();

        var response = await client.PutAsJsonAsync(
            $"/api/cv/proveedor-ia/{id}", new { proveedor = "claude", nombre = (string?)null, modelo = "modelo-nuevo", endpoint = (string?)null, apiKey = (string?)null }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var cipher = scope.ServiceProvider.GetRequiredService<IApiKeyCipher>();
        var fila = await db.ProveedoresIa.AsNoTracking().SingleAsync(p => p.CurriculumId == curriculumId);
        Assert.Equal(apiKeyOriginal, cipher.Decrypt(fila.ApiKeyCifrada!));
        Assert.Equal("modelo-nuevo", fila.Modelo);
    }

    [Fact]
    public async Task Actualizar_ConNuevaApiKey_LaReemplaza()
    {
        var (client, curriculumId) = await CreateAuthenticatedClientAsync("provia-reemplaza-clave");
        var creado = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude", apiKey: "clave-vieja"), CamelCase);
        var id = JsonDocument.Parse(await creado.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();

        await client.PutAsJsonAsync(
            $"/api/cv/proveedor-ia/{id}", new { proveedor = "claude", nombre = (string?)null, modelo = (string?)null, endpoint = (string?)null, apiKey = "clave-nueva" }, CamelCase);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var cipher = scope.ServiceProvider.GetRequiredService<IApiKeyCipher>();
        var fila = await db.ProveedoresIa.AsNoTracking().SingleAsync(p => p.CurriculumId == curriculumId);
        Assert.Equal("clave-nueva", cipher.Decrypt(fila.ApiKeyCifrada!));
    }

    [Fact]
    public async Task Actualizar_DeOtroUsuario_Retorna403()
    {
        var (clientA, _) = await CreateAuthenticatedClientAsync("provia-upd-ownerA");
        var (clientB, _) = await CreateAuthenticatedClientAsync("provia-upd-ownerB");
        var creado = await clientA.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude"), CamelCase);
        var id = JsonDocument.Parse(await creado.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();

        var response = await clientB.PutAsJsonAsync(
            $"/api/cv/proveedor-ia/{id}", new { proveedor = "claude", nombre = (string?)null, modelo = (string?)null, endpoint = (string?)null, apiKey = "hackeada" }, CamelCase);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Actualizar_Inexistente_Retorna404()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("provia-upd-404");

        var response = await client.PutAsJsonAsync(
            "/api/cv/proveedor-ia/999999", new { proveedor = "claude", nombre = (string?)null, modelo = (string?)null, endpoint = (string?)null, apiKey = "clave" }, CamelCase);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Eliminar_LaActiva_ActivaAutomaticamenteOtra()
    {
        var (client, curriculumId) = await CreateAuthenticatedClientAsync("provia-elim-reactiva");
        var primera = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude"), CamelCase);
        var primeraId = JsonDocument.Parse(await primera.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();
        await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("openai"), CamelCase);

        var deleteResponse = await client.DeleteAsync($"/api/cv/proveedor-ia/{primeraId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var restante = await db.ProveedoresIa.AsNoTracking().SingleAsync(p => p.CurriculumId == curriculumId);
        Assert.Equal("openai", restante.Proveedor);
        Assert.True(restante.EsActivo);
    }

    [Fact]
    public async Task Eliminar_LaUnica_DejaLaListaVacia()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("provia-elim-unica");
        var creado = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude"), CamelCase);
        var id = JsonDocument.Parse(await creado.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();

        var deleteResponse = await client.DeleteAsync($"/api/cv/proveedor-ia/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await client.GetAsync("/api/cv/proveedor-ia");
        Assert.Equal("[]", (await getResponse.Content.ReadAsStringAsync()).Trim());
    }

    [Fact]
    public async Task Eliminar_DeOtroUsuario_Retorna403YNoLoBorra()
    {
        var (clientA, curriculumIdA) = await CreateAuthenticatedClientAsync("provia-del-ownerA");
        var (clientB, _) = await CreateAuthenticatedClientAsync("provia-del-ownerB");
        var creado = await clientA.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude"), CamelCase);
        var id = JsonDocument.Parse(await creado.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();

        var response = await clientB.DeleteAsync($"/api/cv/proveedor-ia/{id}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        Assert.Equal(1, await db.ProveedoresIa.CountAsync(p => p.CurriculumId == curriculumIdA));
    }

    [Fact]
    public async Task Activar_CambiaCualEsLaActivaYSoloDejaUna()
    {
        var (client, curriculumId) = await CreateAuthenticatedClientAsync("provia-activar");
        var primera = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude"), CamelCase);
        var primeraId = JsonDocument.Parse(await primera.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();
        var segunda = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("openai"), CamelCase);
        var segundaId = JsonDocument.Parse(await segunda.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();

        var response = await client.PutAsync($"/api/cv/proveedor-ia/{segundaId}/activar", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.True(dto.GetProperty("esActivo").GetBoolean());

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var filas = await db.ProveedoresIa.AsNoTracking().Where(p => p.CurriculumId == curriculumId).ToListAsync();
        Assert.Single(filas, p => p.EsActivo);
        Assert.True(filas.Single(p => p.ProveedorIaId == segundaId).EsActivo);
        Assert.False(filas.Single(p => p.ProveedorIaId == primeraId).EsActivo);
    }

    [Fact]
    public async Task Activar_LaDeMenorIdMientrasOtraDeMayorIdEstaActiva_NoFallaPorElIndiceUnico()
    {
        // Regresion: activar la fila de MENOR id mientras la de MAYOR id esta activa
        // reproducia "Cannot insert duplicate key row ... UQ_ProveedorIa_Curriculum_Activo"
        // -- EF Core no garantiza que el UPDATE de "desactivar" salga antes que el de
        // "activar" dentro de un mismo SaveChanges cuando el orden por id no coincide.
        var (client, curriculumId) = await CreateAuthenticatedClientAsync("provia-activar-orden");
        var primera = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude"), CamelCase);
        var primeraId = JsonDocument.Parse(await primera.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();
        var segunda = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("openai"), CamelCase);
        var segundaId = JsonDocument.Parse(await segunda.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();
        await client.PutAsync($"/api/cv/proveedor-ia/{segundaId}/activar", null); // ahora la de mayor id (segundaId) esta activa

        var response = await client.PutAsync($"/api/cv/proveedor-ia/{primeraId}/activar", null); // reactivar la de menor id

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var filas = await db.ProveedoresIa.AsNoTracking().Where(p => p.CurriculumId == curriculumId).ToListAsync();
        Assert.Single(filas, p => p.EsActivo);
        Assert.True(filas.Single(p => p.ProveedorIaId == primeraId).EsActivo);
    }

    [Fact]
    public async Task Activar_DeOtroUsuario_Retorna403()
    {
        var (clientA, _) = await CreateAuthenticatedClientAsync("provia-act-ownerA");
        var (clientB, _) = await CreateAuthenticatedClientAsync("provia-act-ownerB");
        var creado = await clientA.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude"), CamelCase);
        var id = JsonDocument.Parse(await creado.Content.ReadAsStringAsync()).RootElement.GetProperty("proveedorIaId").GetInt32();

        var response = await clientB.PutAsync($"/api/cv/proveedor-ia/{id}/activar", null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Get_EsAisladoPorCurriculum()
    {
        var (clientA, _) = await CreateAuthenticatedClientAsync("provia-userA");
        var (clientB, _) = await CreateAuthenticatedClientAsync("provia-userB");
        await clientA.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude"), CamelCase);

        var responseB = await clientB.GetAsync("/api/cv/proveedor-ia");

        Assert.Equal("[]", (await responseB.Content.ReadAsStringAsync()).Trim());
    }

    [Fact]
    public async Task Probar_ConProveedorSinSoporteRealTodavia_RespondeOkFalseSinFallar()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("provia-probar-noclaude");

        var response = await client.PostAsJsonAsync(
            "/api/cv/proveedor-ia/probar", new { proveedor = "openai", modelo = (string?)null, endpoint = (string?)null, apiKey = "clave" }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.False(dto.GetProperty("ok").GetBoolean());
    }

    [Fact]
    public async Task Probar_ClaudeSinApiKey_RespondeOkFalse()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("provia-probar-sinkey");

        var response = await client.PostAsJsonAsync(
            "/api/cv/proveedor-ia/probar", new { proveedor = "claude", modelo = (string?)null, endpoint = (string?)null, apiKey = (string?)null }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.False(dto.GetProperty("ok").GetBoolean());
    }

    [Fact]
    public async Task ProbarGuardada_ConProveedorSinSoporteRealTodavia_RespondeOkFalseSinFallar()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("provia-probarguardada-openai");
        var creado = await client.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("openai", apiKey: "clave"), CamelCase);
        var id = (await creado.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("proveedorIaId").GetInt32();

        var response = await client.PostAsync($"/api/cv/proveedor-ia/{id}/probar", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.False(dto.GetProperty("ok").GetBoolean());
    }

    [Fact]
    public async Task ProbarGuardada_De404_SiNoPertenceAlCurriculum()
    {
        var (clientA, _) = await CreateAuthenticatedClientAsync("provia-probarguardada-ownerA");
        var (clientB, _) = await CreateAuthenticatedClientAsync("provia-probarguardada-ownerB");
        var creado = await clientA.PostAsJsonAsync("/api/cv/proveedor-ia", CrearBody("claude"), CamelCase);
        var id = (await creado.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("proveedorIaId").GetInt32();

        var response = await clientB.PostAsync($"/api/cv/proveedor-ia/{id}/probar", null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
