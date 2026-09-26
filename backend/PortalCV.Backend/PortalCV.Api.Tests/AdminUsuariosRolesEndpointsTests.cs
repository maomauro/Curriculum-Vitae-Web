using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests de regresion de autorizacion para los endpoints de gestion de usuarios y
/// roles de AdminController (superficie mas sensible del sistema: activar/desactivar
/// cuentas, publicar/ocultar CVs ajenos, asignar/quitar roles). El JWT se arma a mano
/// (mismo patron que AdminAuditoriaAuthEndpointsTests) para poder emitir tanto un
/// token con rol "Admin" como uno con rol "Publicador" sin pasar por
/// /api/auth/register + /login.
///
/// Los casos "ComoAdmin" sobre ids inexistentes esperan 404 (no 403 ni 401): eso
/// prueba que la peticion atraveso el filtro [Authorize(Roles = "Admin")] y llego a
/// la logica del controller, sin necesitar sembrar un Usuario/Rol real en la BD
/// InMemory para cada caso.
/// </summary>
public class AdminUsuariosRolesEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public AdminUsuariosRolesEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClientWithRole(string rol, int usuarioId = 1)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuarioId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, $"{rol.ToLowerInvariant()}@example.com"),
            new Claim(ClaimTypes.Role, rol),
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

    private HttpClient CreateAdminClient() => CreateClientWithRole("Admin");
    private HttpClient CreatePublicadorClient() => CreateClientWithRole("Publicador", usuarioId: 2);

    // ── GET /api/admin/usuarios ──────────────────────────────────────────────

    [Fact]
    public async Task GetUsuarios_ComoAdmin_Retorna200()
    {
        var response = await CreateAdminClient().GetAsync("/api/admin/usuarios");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetUsuarios_SinRolAdmin_Retorna403()
    {
        var response = await CreatePublicadorClient().GetAsync("/api/admin/usuarios");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ── GET /api/admin/roles ─────────────────────────────────────────────────

    [Fact]
    public async Task GetRoles_ComoAdmin_Retorna200()
    {
        var response = await CreateAdminClient().GetAsync("/api/admin/roles");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetRoles_SinRolAdmin_Retorna403()
    {
        var response = await CreatePublicadorClient().GetAsync("/api/admin/roles");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ── PUT /api/admin/usuarios/{id}/estado ──────────────────────────────────

    [Fact]
    public async Task SetEstado_ComoAdmin_UsuarioInexistente_Retorna404()
    {
        var response = await CreateAdminClient().PutAsJsonAsync(
            "/api/admin/usuarios/999999/estado", new { activo = false });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SetEstado_SinRolAdmin_Retorna403()
    {
        var response = await CreatePublicadorClient().PutAsJsonAsync(
            "/api/admin/usuarios/999999/estado", new { activo = false });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ── PUT /api/admin/usuarios/{id}/cv-publicacion ──────────────────────────

    [Fact]
    public async Task SetCvPublicacion_ComoAdmin_UsuarioInexistente_Retorna404()
    {
        var response = await CreateAdminClient().PutAsJsonAsync(
            "/api/admin/usuarios/999999/cv-publicacion", new { publicado = true });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SetCvPublicacion_SinRolAdmin_Retorna403()
    {
        var response = await CreatePublicadorClient().PutAsJsonAsync(
            "/api/admin/usuarios/999999/cv-publicacion", new { publicado = true });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ── POST /api/admin/usuarios/{usuarioId}/roles/{rolId} ───────────────────

    [Fact]
    public async Task AsignarRol_ComoAdmin_UsuarioInexistente_Retorna404()
    {
        var response = await CreateAdminClient().PostAsync(
            "/api/admin/usuarios/999999/roles/999999", content: null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AsignarRol_SinRolAdmin_Retorna403()
    {
        var response = await CreatePublicadorClient().PostAsync(
            "/api/admin/usuarios/999999/roles/999999", content: null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ── DELETE /api/admin/usuarios/{usuarioId}/roles/{rolId} ─────────────────

    [Fact]
    public async Task QuitarRol_ComoAdmin_AsignacionInexistente_Retorna404()
    {
        var response = await CreateAdminClient().DeleteAsync(
            "/api/admin/usuarios/999999/roles/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task QuitarRol_SinRolAdmin_Retorna403()
    {
        var response = await CreatePublicadorClient().DeleteAsync(
            "/api/admin/usuarios/999999/roles/999999");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
