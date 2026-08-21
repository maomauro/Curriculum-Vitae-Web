using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PortalCV.Application;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests de validacion del formulario de contacto publico (POST
/// /api/public/cvs/{urlPublica}/contactar). En clase propia -- no en
/// PublicEndpointsTests -- porque el endpoint tiene rate limiting fijo de 5
/// peticiones/minuto compartido por todos los tests de la clase (misma instancia de
/// TestWebApplicationFactory); mantenerlo en su propia clase evita competir por ese
/// cupo con otros tests publicos.
/// </summary>
public class PublicContactarEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public PublicContactarEndpointTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<string> CrearCurriculumPublicadoAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var slug = $"public-contactar-{Guid.NewGuid():N}";
        var usuario = new Usuario
        {
            Email = $"{slug}@example.com",
            PasswordHash = "no-se-usa-en-este-test",
            Estado = "Activo",
            FechaRegistro = DateTime.UtcNow,
        };
        var curriculum = new Curriculum
        {
            UrlPublica = slug,
            Estado = CurriculumEstados.Publicado,
            FechaCreacion = DateTime.UtcNow,
            FechaActualizacion = DateTime.UtcNow,
            Usuario = usuario,
        };
        usuario.Curriculums.Add(curriculum);
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();
        return slug;
    }

    [Fact]
    public async Task Contactar_CorreoConFormatoInvalido_Retorna400()
    {
        var slug = await CrearCurriculumPublicadoAsync();
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync($"/api/public/cvs/{slug}/contactar", new
        {
            nombre = "Visitante",
            email = "no-es-un-correo",
            mensaje = "Hola",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Contactar_CorreoVacio_Retorna400()
    {
        var slug = await CrearCurriculumPublicadoAsync();
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync($"/api/public/cvs/{slug}/contactar", new
        {
            nombre = "Visitante",
            email = "",
            mensaje = "Hola",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Contactar_NombreDemasiadoLargo_Retorna400SinLlegarAUn500PorMaxLength()
    {
        var slug = await CrearCurriculumPublicadoAsync();
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync($"/api/public/cvs/{slug}/contactar", new
        {
            nombre = new string('x', 101),
            email = "reclutador@example.com",
            mensaje = "Hola",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Contactar_DatosValidos_Retorna200YRegistraElContacto()
    {
        var slug = await CrearCurriculumPublicadoAsync();
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync($"/api/public/cvs/{slug}/contactar", new
        {
            nombre = "Visitante",
            email = "reclutador@example.com",
            mensaje = "Hola, quiero contactarte.",
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var existe = await db.VisitantesContacto.AnyAsync(v => v.Correo == "reclutador@example.com");
        Assert.True(existe);
    }
}
