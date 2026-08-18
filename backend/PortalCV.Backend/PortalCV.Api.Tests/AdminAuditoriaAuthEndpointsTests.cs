using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using PortalCV.Application.Constants;
using PortalCV.Application.DTOs.Admin;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests de integracion de los endpoints admin sobre AuditoriaAuth (listado y
/// purga). El usuario/JWT se arman a mano (mismo patron que
/// CvEditorEndpointsTests.CreateAuthenticatedClientAsync) en vez de pasar por
/// /api/auth/register + /login: evita el rate limiting de "auth-public" y el
/// rol "Admin" no depende de una fila en la tabla Rol, solo del claim JWT.
/// </summary>
public class AdminAuditoriaAuthEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public AdminAuditoriaAuthEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAdminClient()
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, "1"),
            new Claim(JwtRegisteredClaimNames.Email, "admin@example.com"),
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
        var token = new JwtSecurityTokenHandler().WriteToken(jwt);

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cookie", $"portalcv_auth={token}");
        return client;
    }

    private async Task<string> SeedAuditoriaAuthAsync(string accion, DateTime fechaUtc)
    {
        var email = $"auditoria-auth-{Guid.NewGuid():N}@example.com";
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        db.AuditoriasAuth.Add(new AuditoriaAuth
        {
            FechaUtc = fechaUtc,
            Accion = accion,
            Email = email,
        });
        await db.SaveChangesAsync();
        return email;
    }

    [Fact]
    public async Task GetAuditoriaAuth_ComoAdmin_DevuelveElRegistroSembrado()
    {
        var email = await SeedAuditoriaAuthAsync(AuthAuditoriaAcciones.LoginExitoso, DateTime.UtcNow);
        var client = CreateAdminClient();

        var response = await client.GetAsync($"/api/admin/auditoria-auth?q={Uri.EscapeDataString(email)}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains(email, body);
        Assert.Contains(AuthAuditoriaAcciones.LoginExitoso, body);
    }

    [Fact]
    public async Task GetAuditoriaAuth_SinRolAdmin_Retorna403()
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, "2"),
            new Claim(JwtRegisteredClaimNames.Email, "publicador@example.com"),
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

        var response = await client.GetAsync("/api/admin/auditoria-auth");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // Nota: PurgeAsync usa ExecuteSqlRawAsync/ExecuteSqlInterpolatedAsync, que el
    // proveedor InMemory de EF no soporta (arroja InvalidOperationException) —
    // mismo motivo por el que AdminAuditoriaService/CvAuditoriaService.PurgeAsync
    // tampoco tienen tests de integracion hoy. Se cubren aqui solo las validaciones
    // de argumentos (corren antes de la linea SQL) directo contra el servicio.
    [Fact]
    public async Task PurgeAsync_ModoAnioMes_AnioFueraDeRango_LanzaArgumentException()
    {
        using var scope = _factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<PortalCV.Application.Interfaces.IAuthAuditoriaService>();

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.PurgeAsync(AuditoriaPurgeModo.AnioMes, anio: 1500, mes: 5));
    }

    [Fact]
    public async Task PurgeAsync_ModoAnioMes_MesFueraDeRango_LanzaArgumentException()
    {
        using var scope = _factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<PortalCV.Application.Interfaces.IAuthAuditoriaService>();

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.PurgeAsync(AuditoriaPurgeModo.AnioMes, anio: 2024, mes: 13));
    }

    [Fact]
    public async Task PurgeAsync_ModoAnio_AnioFueraDeRango_LanzaArgumentException()
    {
        using var scope = _factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<PortalCV.Application.Interfaces.IAuthAuditoriaService>();

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.PurgeAsync(AuditoriaPurgeModo.Anio, anio: 3000, mes: null));
    }

    [Fact]
    public async Task PurgeAuditoria_TablaAuth_ModoAnioFueraDeRango_ControllerDevuelve400()
    {
        var client = CreateAdminClient();

        var response = await client.PostAsJsonAsync("/api/admin/auditoria/purge", new
        {
            tabla = "auth",
            modo = "anio",
            anio = 3000,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PurgeAuditoria_TablaAuth_ModoTodo_SinConfirmacion_Retorna400()
    {
        var client = CreateAdminClient();

        var response = await client.PostAsJsonAsync("/api/admin/auditoria/purge", new
        {
            tabla = "auth",
            modo = "todo",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PurgeAuditoria_TablaDesconocida_Retorna400()
    {
        var client = CreateAdminClient();

        var response = await client.PostAsJsonAsync("/api/admin/auditoria/purge", new
        {
            tabla = "no-existe",
            modo = "anio",
            anio = 2024,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
