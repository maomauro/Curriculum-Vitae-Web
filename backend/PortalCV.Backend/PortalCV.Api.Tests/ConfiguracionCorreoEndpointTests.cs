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
/// Tests de integracion de api/cv/configuracion-correo: SMTP para enviar correos a
/// reclutadores. Una configuracion por CV -- verifica valores por defecto cuando no hay
/// nada guardado, que la contrasena se persiste cifrada (nunca en texto plano) y nunca
/// se devuelve al cliente, y que dejarla en blanco al actualizar mantiene la guardada.
/// </summary>
public class ConfiguracionCorreoEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions CamelCase = new(JsonSerializerDefaults.Web);

    public ConfiguracionCorreoEndpointTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

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

    [Fact]
    public async Task Get_SinConfiguracionGuardada_DevuelveValoresPorDefectoSinContrasena()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("correo-defecto");

        var response = await client.GetAsync("/api/cv/configuracion-correo");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("smtp.gmail.com", dto.GetProperty("host").GetString());
        Assert.Equal(587, dto.GetProperty("puerto").GetInt32());
        Assert.True(dto.GetProperty("usarTls").GetBoolean());
        Assert.False(dto.GetProperty("tieneConfiguracion").GetBoolean());
        Assert.False(dto.TryGetProperty("password", out _));
    }

    [Fact]
    public async Task Guardar_SinContrasenaLaPrimeraVez_Devuelve400()
    {
        var (client, _) = await CreateAuthenticatedClientAsync("correo-sinpass");

        var response = await client.PutAsJsonAsync("/api/cv/configuracion-correo", new
        {
            host = "smtp.gmail.com",
            puerto = 587,
            usarTls = true,
            password = (string?)null,
        }, CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Guardar_PersisteLaContrasenaCifradaYNuncaLaDevuelve()
    {
        var (client, curriculumId) = await CreateAuthenticatedClientAsync("correo-guardar");

        var response = await client.PutAsJsonAsync("/api/cv/configuracion-correo", new
        {
            host = "smtp.gmail.com",
            puerto = 587,
            usarTls = true,
            password = "clave-de-aplicacion-de-prueba",
        }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(dto.GetProperty("tieneConfiguracion").GetBoolean());
        Assert.False(dto.TryGetProperty("password", out _));
        Assert.DoesNotContain("clave-de-aplicacion-de-prueba", await response.Content.ReadAsStringAsync());

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var cipher = scope.ServiceProvider.GetRequiredService<IApiKeyCipher>();
        var entidad = await db.ConfiguracionesCorreo.AsNoTracking()
            .SingleAsync(c => c.CurriculumId == curriculumId);
        Assert.NotNull(entidad.PasswordCifrada);
        Assert.NotEqual("clave-de-aplicacion-de-prueba", entidad.PasswordCifrada);
        Assert.Equal("clave-de-aplicacion-de-prueba", cipher.Decrypt(entidad.PasswordCifrada!));
    }

    [Fact]
    public async Task Guardar_ConContrasenaEnBlancoEnUnaActualizacion_MantieneLaGuardada()
    {
        var (client, curriculumId) = await CreateAuthenticatedClientAsync("correo-mantener");
        await client.PutAsJsonAsync("/api/cv/configuracion-correo", new
        {
            host = "smtp.gmail.com",
            puerto = 587,
            usarTls = true,
            password = "clave-original",
        }, CamelCase);

        var response = await client.PutAsJsonAsync("/api/cv/configuracion-correo", new
        {
            host = "smtp.gmail.com",
            puerto = 465,
            usarTls = false,
            password = (string?)null,
        }, CamelCase);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(465, dto.GetProperty("puerto").GetInt32());
        Assert.False(dto.GetProperty("usarTls").GetBoolean());
        Assert.True(dto.GetProperty("tieneConfiguracion").GetBoolean());

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var cipher = scope.ServiceProvider.GetRequiredService<IApiKeyCipher>();
        var entidad = await db.ConfiguracionesCorreo.AsNoTracking()
            .SingleAsync(c => c.CurriculumId == curriculumId);
        Assert.Equal("clave-original", cipher.Decrypt(entidad.PasswordCifrada!));
    }
}
