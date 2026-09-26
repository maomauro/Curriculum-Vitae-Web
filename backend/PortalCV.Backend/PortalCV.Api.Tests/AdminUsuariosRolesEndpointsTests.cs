using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

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

    [Fact]
    public async Task SetEstado_DesactivarPropiaCuenta_Retorna400()
    {
        var id = await SembrarUsuarioAsync("Activo");
        var client = CreateClientWithRole("Admin", usuarioId: id);

        var response = await client.PutAsJsonAsync($"/api/admin/usuarios/{id}/estado", new { activo = false });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task SetEstado_ActivarPropiaCuenta_NoEstaBloqueado()
    {
        var id = await SembrarUsuarioAsync("Activo");
        var client = CreateClientWithRole("Admin", usuarioId: id);

        var response = await client.PutAsJsonAsync($"/api/admin/usuarios/{id}/estado", new { activo = true });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task SetEstado_DesactivarUltimoAdminActivo_Retorna400()
    {
        var id = await SembrarUsuarioAsync("Activo", rolAdmin: true);

        var response = await CreateAdminClient().PutAsJsonAsync($"/api/admin/usuarios/{id}/estado", new { activo = false });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task SetEstado_DesactivarAdmin_PermiteSiHayOtroAdminActivo()
    {
        var otroAdminId = await SembrarUsuarioAsync("Activo", rolAdmin: true);
        var idADesactivar = await SembrarUsuarioAsync("Activo", rolAdmin: true);

        var response = await CreateAdminClient().PutAsJsonAsync(
            $"/api/admin/usuarios/{idADesactivar}/estado", new { activo = false });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        _ = otroAdminId;
    }

    [Fact]
    public async Task SetEstado_DesactivarUsuarioSinRolAdmin_Permite()
    {
        var id = await SembrarUsuarioAsync("Activo");

        var response = await CreateAdminClient().PutAsJsonAsync($"/api/admin/usuarios/{id}/estado", new { activo = false });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
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

    // ── DELETE /api/admin/usuarios/{id} ──────────────────────────────────────

    [Fact]
    public async Task EliminarUsuario_ComoAdmin_Inexistente_Retorna404()
    {
        var response = await CreateAdminClient().DeleteAsync("/api/admin/usuarios/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task EliminarUsuario_SinRolAdmin_Retorna403()
    {
        var response = await CreatePublicadorClient().DeleteAsync("/api/admin/usuarios/999999");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task EliminarUsuario_UsuarioActivo_Retorna400()
    {
        var id = await SembrarUsuarioAsync("Activo");

        var response = await CreateAdminClient().DeleteAsync($"/api/admin/usuarios/{id}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task EliminarUsuario_PropiaCuenta_Retorna400()
    {
        var id = await SembrarUsuarioAsync("Inactivo");
        var client = CreateClientWithRole("Admin", usuarioId: id);

        var response = await client.DeleteAsync($"/api/admin/usuarios/{id}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task EliminarUsuario_UltimoAdmin_Retorna400()
    {
        var id = await SembrarUsuarioAsync("Inactivo", rolAdmin: true);

        var response = await CreateAdminClient().DeleteAsync($"/api/admin/usuarios/{id}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task EliminarUsuario_ComoAdmin_UsuarioInactivo_Elimina204YQuedaBorradoDeBD()
    {
        var id = await SembrarUsuarioAsync("Inactivo");

        var response = await CreateAdminClient().DeleteAsync($"/api/admin/usuarios/{id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        Assert.Null(await db.Usuarios.FindAsync(id));
    }

    /// <summary>
    /// Caso borde real: si el usuario a eliminar quedo como actor en AuditoriaCv o como
    /// "actualizado por" en PromptIa de un CURRICULUM AJENO (no el suyo -- ese se elimina
    /// solo via cascada), esas dos FK son ON DELETE NO ACTION y harian fallar el DELETE si
    /// no se limpian antes. Verifica que EliminarUsuario las deja en null en vez de fallar.
    /// </summary>
    [Fact]
    public async Task EliminarUsuario_LimpiaReferenciasCruzadasEnAuditoriaCvYPromptIa_AntesDeEliminar()
    {
        int idObjetivo;
        int auditoriaCvId;
        int promptIaId;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();

            var objetivo = new Usuario
            {
                Email = $"eliminar-cruzado-{Guid.NewGuid():N}@example.com",
                PasswordHash = "no-se-usa-en-este-test",
                Estado = "Inactivo",
                FechaRegistro = DateTime.UtcNow,
            };
            db.Usuarios.Add(objetivo);
            await db.SaveChangesAsync();
            idObjetivo = objetivo.UsuarioId;

            var otroUsuario = new Usuario
            {
                Email = $"otro-{Guid.NewGuid():N}@example.com",
                PasswordHash = "no-se-usa-en-este-test",
                Estado = "Activo",
                FechaRegistro = DateTime.UtcNow,
            };
            var curriculumAjeno = new Curriculum
            {
                UrlPublica = $"cv-{Guid.NewGuid():N}",
                Estado = "Borrador",
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow,
                Usuario = otroUsuario,
            };
            otroUsuario.Curriculums.Add(curriculumAjeno);
            db.Usuarios.Add(otroUsuario);
            await db.SaveChangesAsync();

            var auditoria = new AuditoriaCv
            {
                FechaUtc = DateTime.UtcNow,
                ActorUsuarioId = idObjetivo,
                CurriculumId = curriculumAjeno.CurriculumId,
                Accion = "test.accion",
                EntidadTipo = "Test",
            };
            db.AuditoriasCv.Add(auditoria);

            var prompt = new PromptIa
            {
                CurriculumId = curriculumAjeno.CurriculumId,
                Codigo = "TEST_PROMPT",
                Nombre = "Test",
                RolContexto = "x",
                Tarea = "x",
                FormatoSalida = "x",
                Contenido = "x",
                FechaCreacion = DateTime.UtcNow,
                ActualizadoPorUsuarioId = idObjetivo,
            };
            db.PromptsIa.Add(prompt);

            await db.SaveChangesAsync();
            auditoriaCvId = auditoria.AuditoriaCvId;
            promptIaId = prompt.PromptIaId;
        }

        var response = await CreateAdminClient().DeleteAsync($"/api/admin/usuarios/{idObjetivo}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<PortalCvDbContext>();

        Assert.Null(await verifyDb.Usuarios.FindAsync(idObjetivo));

        var auditoriaVerificada = await verifyDb.AuditoriasCv.FindAsync(auditoriaCvId);
        Assert.NotNull(auditoriaVerificada);
        Assert.Null(auditoriaVerificada!.ActorUsuarioId);

        var promptVerificado = await verifyDb.PromptsIa.FindAsync(promptIaId);
        Assert.NotNull(promptVerificado);
        Assert.Null(promptVerificado!.ActualizadoPorUsuarioId);
    }

    private async Task<int> SembrarUsuarioAsync(string estado, bool rolAdmin = false)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();

        var usuario = new Usuario
        {
            Email = $"eliminar-{Guid.NewGuid():N}@example.com",
            PasswordHash = "no-se-usa-en-este-test",
            Estado = estado,
            FechaRegistro = DateTime.UtcNow,
        };
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        if (rolAdmin)
        {
            var rolExistente = await db.Roles.FirstOrDefaultAsync(r => r.NombreRol == "Admin");
            var rolId = rolExistente?.RolId;
            if (rolId is null)
            {
                var rol = new Rol { NombreRol = "Admin", Descripcion = "Admin" };
                db.Roles.Add(rol);
                await db.SaveChangesAsync();
                rolId = rol.RolId;
            }
            db.UsuarioRoles.Add(new UsuarioRol { UsuarioId = usuario.UsuarioId, RolId = rolId.Value });
            await db.SaveChangesAsync();
        }

        return usuario.UsuarioId;
    }
}
