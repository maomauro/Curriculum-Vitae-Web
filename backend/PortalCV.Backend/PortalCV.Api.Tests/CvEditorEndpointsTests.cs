using System.IdentityModel.Tokens.Jwt;
using System.Net;
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
/// Tests de integracion del editor de CV (api/cv/*): CRUD completo sobre una
/// entidad representativa (Perfil) para ejercitar los helpers compartidos de
/// CvEditorService (GetOwnedOrThrowAsync, GuardarYNotificarAsync,
/// DeleteEntidadAsync) que usan las 8 entidades del editor.
///
/// El usuario/curriculum se crean directo en la base (via scope) y el JWT se
/// arma a mano (mismo patron que CrearJwtSinCurriculumId en
/// AuthEndpointsTests) en vez de pasar por /api/auth/register + /login:
/// evita depender del seed de la tabla Rol (no existe en la InMemory de
/// tests) y del rate limiting real de "auth-public" (10 req/min), que con
/// varios tests haciendo register+login cada uno se agota rapido.
/// </summary>
public class CvEditorEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public CvEditorEndpointsTests(TestWebApplicationFactory factory)
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

    private static StringContent PerfilPayload(string nombre, decimal? experienciaAnios = null) =>
        new(
            $"{{\"nombrePerfil\":\"{nombre}\",\"descripcionPerfil\":null,\"experienciaPerfilAnios\":{(experienciaAnios.HasValue ? experienciaAnios.Value.ToString() : "null")},\"aspiracionSalarialPesos\":null,\"aspiracionSalarialDolares\":null,\"esActivo\":true}}",
            Encoding.UTF8, "application/json");

    [Fact]
    public async Task Perfil_CrudCompleto_FuncionaDePrincipioAFin()
    {
        var client = await CreateAuthenticatedClientAsync("perfil-crud");

        var getInicial = await client.GetAsync("/api/cv/perfiles");
        Assert.Equal(HttpStatusCode.OK, getInicial.StatusCode);
        Assert.Equal("[]", (await getInicial.Content.ReadAsStringAsync()).Trim());

        var createResponse = await client.PostAsync("/api/cv/perfiles", PerfilPayload("Backend Developer", 5));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var perfilId = created.GetProperty("perfilId").GetInt32();
        Assert.True(perfilId > 0);
        Assert.Equal("Backend Developer", created.GetProperty("nombrePerfil").GetString());

        var updateResponse = await client.PutAsync($"/api/cv/perfiles/{perfilId}", PerfilPayload("Backend Developer Senior", 6));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = JsonDocument.Parse(await updateResponse.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("Backend Developer Senior", updated.GetProperty("nombrePerfil").GetString());

        var getConDato = await client.GetAsync("/api/cv/perfiles");
        var lista = JsonDocument.Parse(await getConDato.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(1, lista.GetArrayLength());

        var deleteResponse = await client.DeleteAsync($"/api/cv/perfiles/{perfilId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getFinal = await client.GetAsync("/api/cv/perfiles");
        Assert.Equal("[]", (await getFinal.Content.ReadAsStringAsync()).Trim());
    }

    [Fact]
    public async Task Perfil_Update_DeOtroUsuario_Retorna403()
    {
        var clientA = await CreateAuthenticatedClientAsync("perfil-owner");
        var clientB = await CreateAuthenticatedClientAsync("perfil-intruder");

        var createResponse = await clientA.PostAsync("/api/cv/perfiles", PerfilPayload("Perfil de A"));
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var perfilId = created.GetProperty("perfilId").GetInt32();

        var updateResponse = await clientB.PutAsync($"/api/cv/perfiles/{perfilId}", PerfilPayload("Hackeado"));

        Assert.Equal(HttpStatusCode.Forbidden, updateResponse.StatusCode);
    }

    [Fact]
    public async Task Perfil_Delete_DeOtroUsuario_Retorna403YNoLoBorra()
    {
        var clientA = await CreateAuthenticatedClientAsync("perfil-owner2");
        var clientB = await CreateAuthenticatedClientAsync("perfil-intruder2");

        var createResponse = await clientA.PostAsync("/api/cv/perfiles", PerfilPayload("Perfil protegido"));
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var perfilId = created.GetProperty("perfilId").GetInt32();

        var deleteResponse = await clientB.DeleteAsync($"/api/cv/perfiles/{perfilId}");
        Assert.Equal(HttpStatusCode.Forbidden, deleteResponse.StatusCode);

        var getDeA = await clientA.GetAsync("/api/cv/perfiles");
        var lista = JsonDocument.Parse(await getDeA.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(1, lista.GetArrayLength());
    }

    [Fact]
    public async Task Perfil_Update_Inexistente_Retorna404()
    {
        var client = await CreateAuthenticatedClientAsync("perfil-404");

        var response = await client.PutAsync("/api/cv/perfiles/999999", PerfilPayload("No existe"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
