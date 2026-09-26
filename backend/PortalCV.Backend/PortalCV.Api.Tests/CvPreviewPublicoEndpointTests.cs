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
/// Tests de GET /api/cv/visibilidad/preview-publico: mismo DTO y filtrado que ve un
/// visitante, pero para el dueño del CV -- sin exigir Estado=Publicado.
/// </summary>
public class CvPreviewPublicoEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions CamelCase = new(JsonSerializerDefaults.Web);

    public CvPreviewPublicoEndpointTests(TestWebApplicationFactory factory)
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

    [Fact]
    public async Task GetPreviewPublico_ConCvEnBorrador_Responde200()
    {
        // El endpoint publico real (GetDetalleAsync) 404 con un CV sin publicar; este
        // preview debe funcionar igual para que el dueño pueda ajustar antes de publicar.
        var client = await CreateAuthenticatedClientAsync("preview-borrador");

        var response = await client.GetAsync("/api/cv/visibilidad/preview-publico");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetPreviewPublico_SinAutenticacion_Retorna401()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/cv/visibilidad/preview-publico");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetPreviewPublico_RefleajaCambiosDeVisibilidadGuardadosPorPut()
    {
        var client = await CreateAuthenticatedClientAsync("preview-refleja");

        var putResponse = await client.PutAsJsonAsync(
            "/api/cv/visibilidad", new[] { new { nombreSeccion = "proyectos", esVisible = false } }, CamelCase);
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        var response = await client.GetAsync("/api/cv/visibilidad/preview-publico");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var visibilidad = dto.GetProperty("visibilidadSeccion").EnumerateArray()
            .Select(v => (Seccion: v.GetProperty("seccion").GetString(), Visible: v.GetProperty("visible").GetBoolean()))
            .ToList();

        Assert.Contains(visibilidad, v => v.Seccion == "proyectos" && v.Visible == false);
    }

    [Fact]
    public async Task GetPreviewPublico_NoCuentaComoVisita()
    {
        // A diferencia del endpoint publico real, este no debe encolar registro de visita
        // (es el dueño mirando su propio CV, no un visitante).
        var client = await CreateAuthenticatedClientAsync("preview-sin-visita");

        await client.GetAsync("/api/cv/visibilidad/preview-publico");
        await client.GetAsync("/api/cv/visibilidad/preview-publico");

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var dto = await client.GetAsync("/api/cv/visibilidad/preview-publico");
        var curriculumId = (await dto.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("curriculumId").GetInt32();
        var contador = await db.Curriculums.AsNoTracking()
            .Where(c => c.CurriculumId == curriculumId)
            .Select(c => c.ContadorVisitas)
            .SingleAsync();

        Assert.Equal(0, contador);
    }
}
