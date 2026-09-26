using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PortalCV.Application;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Api.Tests;

/// <summary>
/// El listado publico "/api/public/cvs" arma `fotoUrl` mirando solo si hay FotoBytes
/// subidos, sin revisar el interruptor de visibilidad "Foto" -- pero el endpoint que
/// sirve el archivo si lo revisa. Antes del fix, con el interruptor apagado, el listado
/// devolvia igual la URL del endpoint y el navegador recibia 404 al pedirla. En clase
/// propia por el mismo motivo que PublicCvAdjuntosTests: publicar un CV rompe el test
/// que asume la base de PublicEndpointsTests siempre vacia.
/// </summary>
public class PublicCvListadoFotoTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private static readonly byte[] FotoBytesDePrueba = { 0xFF, 0xD8, 0xFF, 1, 2, 3 };

    public PublicCvListadoFotoTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<string> CrearCurriculumConFotoAsync(string slugPrefix, bool? fotoVisible)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var slug = $"{slugPrefix}-{Guid.NewGuid():N}";
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
            Personales = new Personales
            {
                PrimerNombre = "Edgar",
                PrimerApellido = "Cifuentes",
                FotoBytes = FotoBytesDePrueba,
                FotoContentType = "image/jpeg",
            },
        };
        usuario.Curriculums.Add(curriculum);
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        if (fotoVisible.HasValue)
        {
            db.VisibilidadesSeccion.Add(new VisibilidadSeccion
            {
                CurriculumId = curriculum.CurriculumId,
                NombreSeccion = "datos-personales.foto",
                EsVisible = fotoVisible.Value,
            });
            await db.SaveChangesAsync();
        }

        return slug;
    }

    private async Task<JsonElement?> BuscarItemDelListadoAsync(string slug)
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/public/cvs?pageSize=50");
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        foreach (var item in dto.GetProperty("items").EnumerateArray())
        {
            if (item.GetProperty("urlPublica").GetString() == slug) return item;
        }
        return null;
    }

    [Fact]
    public async Task BuscarCvs_ConFotoSubidaYVisibilidadPorDefecto_TraeLaUrlDeFoto()
    {
        var slug = await CrearCurriculumConFotoAsync("public-listado-foto-default", fotoVisible: null);

        var item = await BuscarItemDelListadoAsync(slug);

        Assert.NotNull(item);
        Assert.Equal($"/api/public/cvs/{slug}/foto", item!.Value.GetProperty("fotoUrl").GetString());
    }

    [Fact]
    public async Task BuscarCvs_ConFotoSubidaPeroVisibilidadFotoEnFalse_NoTraeUrlDeFoto()
    {
        var slug = await CrearCurriculumConFotoAsync("public-listado-foto-oculta", fotoVisible: false);

        var item = await BuscarItemDelListadoAsync(slug);

        Assert.NotNull(item);
        Assert.Equal(JsonValueKind.Null, item!.Value.GetProperty("fotoUrl").ValueKind);
    }

    [Fact]
    public async Task BuscarCvsYGetFoto_ConVisibilidadFotoEnFalse_NuncaHayUnaUrlQueDeVuelva404()
    {
        // Regresion del bug real: si el listado alguna vez vuelve a devolver la URL sin
        // chequear visibilidad, este test lo detecta pidiendo esa URL y esperando 404.
        var slug = await CrearCurriculumConFotoAsync("public-listado-foto-sin-404", fotoVisible: false);
        var item = await BuscarItemDelListadoAsync(slug);
        Assert.NotNull(item);
        Assert.Equal(JsonValueKind.Null, item!.Value.GetProperty("fotoUrl").ValueKind);
    }
}
