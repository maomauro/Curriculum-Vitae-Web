using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests de integracion de api/prompts-ia: cada usuario administra sus propios prompts
/// (listar, historial, crear codigo nuevo, crear version nueva, activar version anterior),
/// con verificacion de ownership entre usuarios distintos. Mismo patron de autenticacion que
/// CvEditorEndpointsTests (usuario/curriculum creados directo en la base, JWT armado a mano).
/// </summary>
public class PromptsIaEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions CamelCase = new(JsonSerializerDefaults.Web);

    public PromptsIaEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync(string emailPrefix)
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
        return client;
    }

    private static object CrearPromptBody(string codigo) => new
    {
        codigo,
        nombre = "Extractor de oferta",
        descripcion = "Extrae datos de una oferta laboral",
        rolContexto = "Eres un asistente que analiza ofertas laborales.",
        tarea = "Extrae cargo, empresa y descripción de {{OFERTA_TEXTO}}.",
        reglas = "Responde solo en español.",
        formatoSalida = "{\"cargo\": string, \"empresa\": string}",
        ejemplos = (string?)null,
    };

    [Fact]
    public async Task GetPrompts_SinPrompts_DevuelveListaVacia()
    {
        var client = await CreateAuthenticatedClientAsync("prompts-vacio");

        var response = await client.GetAsync("/api/prompts-ia");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("[]", (await response.Content.ReadAsStringAsync()).Trim());
    }

    [Fact]
    public async Task CrearPrompt_CodigoNuevo_EnsamblaContenidoYCreaVersion1()
    {
        var client = await CreateAuthenticatedClientAsync("prompts-crear");
        var codigo = $"EXTRACTOR_{Guid.NewGuid():N}".ToUpperInvariant()[..20];

        var response = await client.PostAsJsonAsync("/api/prompts-ia", CrearPromptBody(codigo), CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"version\":1", body);
        Assert.Contains("\"esActivo\":true", body);
        Assert.Contains("[ROL Y CONTEXTO]", body);
        Assert.Contains("[TAREA]", body);
        Assert.Contains("[REGLAS]", body);
        Assert.Contains("[FORMATO DE SALIDA]", body);
    }

    [Fact]
    public async Task CrearPrompt_CodigoDuplicadoParaElMismoUsuario_Retorna400()
    {
        var client = await CreateAuthenticatedClientAsync("prompts-dup");
        var codigo = $"DUP_{Guid.NewGuid():N}".ToUpperInvariant()[..20];
        await client.PostAsJsonAsync("/api/prompts-ia", CrearPromptBody(codigo), CamelCase);

        var response = await client.PostAsJsonAsync("/api/prompts-ia", CrearPromptBody(codigo), CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CrearPrompt_MismoCodigoParaDosUsuariosDistintos_NoChoca()
    {
        var codigo = $"COMPARTIDO_{Guid.NewGuid():N}".ToUpperInvariant()[..20];
        var clientA = await CreateAuthenticatedClientAsync("prompts-userA");
        var clientB = await CreateAuthenticatedClientAsync("prompts-userB");

        var responseA = await clientA.PostAsJsonAsync("/api/prompts-ia", CrearPromptBody(codigo), CamelCase);
        var responseB = await clientB.PostAsJsonAsync("/api/prompts-ia", CrearPromptBody(codigo), CamelCase);

        Assert.Equal(HttpStatusCode.OK, responseA.StatusCode);
        Assert.Equal(HttpStatusCode.OK, responseB.StatusCode);
    }

    [Fact]
    public async Task CrearPrompt_CamposRequeridosFaltantes_Retorna400()
    {
        var client = await CreateAuthenticatedClientAsync("prompts-invalido");

        var response = await client.PostAsJsonAsync("/api/prompts-ia", new
        {
            codigo = "SIN_TAREA",
            nombre = "Nombre",
            rolContexto = "Rol",
            tarea = "",
            formatoSalida = "{}",
        }, CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetPrompts_ListaSoloLosPromptsDelUsuarioActual()
    {
        var clientA = await CreateAuthenticatedClientAsync("prompts-listaA");
        var clientB = await CreateAuthenticatedClientAsync("prompts-listaB");
        var codigoA = $"A_{Guid.NewGuid():N}".ToUpperInvariant()[..20];
        var codigoB = $"B_{Guid.NewGuid():N}".ToUpperInvariant()[..20];
        await clientA.PostAsJsonAsync("/api/prompts-ia", CrearPromptBody(codigoA), CamelCase);
        await clientB.PostAsJsonAsync("/api/prompts-ia", CrearPromptBody(codigoB), CamelCase);

        var responseA = await clientA.GetAsync("/api/prompts-ia");

        var body = await responseA.Content.ReadAsStringAsync();
        Assert.Contains(codigoA, body);
        Assert.DoesNotContain(codigoB, body);
    }

    [Fact]
    public async Task CrearVersion_SobreCodigoExistente_CreaVersion2YDesactivaLaAnterior()
    {
        var client = await CreateAuthenticatedClientAsync("prompts-version");
        var codigo = $"VER_{Guid.NewGuid():N}".ToUpperInvariant()[..20];
        await client.PostAsJsonAsync("/api/prompts-ia", CrearPromptBody(codigo), CamelCase);

        var response = await client.PostAsJsonAsync($"/api/prompts-ia/{codigo}/versiones", new
        {
            nombre = "Extractor de oferta v2",
            descripcion = (string?)null,
            rolContexto = "Rol actualizado",
            tarea = "Tarea actualizada {{OFERTA_TEXTO}}",
            reglas = (string?)null,
            formatoSalida = "{}",
            ejemplos = (string?)null,
        }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"version\":2", body);

        var historial = await client.GetAsync($"/api/prompts-ia/{codigo}");
        var historialBody = await historial.Content.ReadAsStringAsync();
        Assert.Contains("\"version\":2,\"esActivo\":true", historialBody.Replace(" ", ""));
        Assert.Contains("\"version\":1,\"esActivo\":false", historialBody.Replace(" ", ""));
    }

    [Fact]
    public async Task CrearVersion_CodigoInexistente_Retorna404()
    {
        var client = await CreateAuthenticatedClientAsync("prompts-version-404");

        var response = await client.PostAsJsonAsync("/api/prompts-ia/NO_EXISTE/versiones", new
        {
            nombre = "Nombre",
            rolContexto = "Rol",
            tarea = "Tarea",
            formatoSalida = "{}",
        }, CamelCase);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CrearVersion_CodigoDeOtroUsuario_Retorna404()
    {
        var clientA = await CreateAuthenticatedClientAsync("prompts-ownerA");
        var clientB = await CreateAuthenticatedClientAsync("prompts-ownerB");
        var codigo = $"PRIVADO_{Guid.NewGuid():N}".ToUpperInvariant()[..20];
        await clientA.PostAsJsonAsync("/api/prompts-ia", CrearPromptBody(codigo), CamelCase);

        var response = await clientB.PostAsJsonAsync($"/api/prompts-ia/{codigo}/versiones", new
        {
            nombre = "Nombre",
            rolContexto = "Rol",
            tarea = "Tarea",
            formatoSalida = "{}",
        }, CamelCase);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ActivarVersion_VersionAnteriorPropia_LaReactivaYDesactivaLaActual()
    {
        var client = await CreateAuthenticatedClientAsync("prompts-activar");
        var codigo = $"ACT_{Guid.NewGuid():N}".ToUpperInvariant()[..20];
        var creado = await client.PostAsJsonAsync("/api/prompts-ia", CrearPromptBody(codigo), CamelCase);
        var creadoDto = await creado.Content.ReadFromJsonAsync<JsonElement>();
        var v1Id = creadoDto.GetProperty("promptIaId").GetInt32();

        await client.PostAsJsonAsync($"/api/prompts-ia/{codigo}/versiones", new
        {
            nombre = "v2",
            rolContexto = "Rol",
            tarea = "Tarea",
            formatoSalida = "{}",
        }, CamelCase);

        var response = await client.PutAsync($"/api/prompts-ia/versiones/{v1Id}/activar", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"version\":1", body);
        Assert.Contains("\"esActivo\":true", body);
    }

    [Fact]
    public async Task ActivarVersion_DeOtroUsuario_Retorna404()
    {
        var clientA = await CreateAuthenticatedClientAsync("prompts-activarA");
        var clientB = await CreateAuthenticatedClientAsync("prompts-activarB");
        var codigo = $"AJENA_{Guid.NewGuid():N}".ToUpperInvariant()[..20];
        var creado = await clientA.PostAsJsonAsync("/api/prompts-ia", CrearPromptBody(codigo), CamelCase);
        var creadoDto = await creado.Content.ReadFromJsonAsync<JsonElement>();
        var promptIaId = creadoDto.GetProperty("promptIaId").GetInt32();

        var response = await clientB.PutAsync($"/api/prompts-ia/versiones/{promptIaId}/activar", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ActivarVersion_IdInexistente_Retorna404()
    {
        var client = await CreateAuthenticatedClientAsync("prompts-activar-404");

        var response = await client.PutAsync("/api/prompts-ia/versiones/999999/activar", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CrearPrompt_RegistraEventoEnAuditoriaCv()
    {
        var client = await CreateAuthenticatedClientAsync("prompts-auditoria");
        var codigo = $"AUD_{Guid.NewGuid():N}".ToUpperInvariant()[..20];

        await client.PostAsJsonAsync("/api/prompts-ia", CrearPromptBody(codigo), CamelCase);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var evento = await db.AuditoriasCv
            .Where(a => a.EntidadTipo == "PromptIa" && a.Accion == "cv.prompt_ia_create")
            .OrderByDescending(a => a.AuditoriaCvId)
            .FirstOrDefaultAsync();

        Assert.NotNull(evento);
        Assert.Contains(codigo, evento!.DetalleJson);
    }
}
