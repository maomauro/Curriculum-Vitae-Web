using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PortalCV.Application;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests de los interruptores maestros de pestaña del CV público (VisibilidadSeccion
/// "profesional.publico" / "hoja-de-vida.publico") en el detalle publico de un CV. En
/// clase propia -- no en PublicEndpointsTests -- porque publicar un CV en esa base
/// compartida rompe su test "BuscarCvs_SinAutenticacion_Retorna200YCeroResultados"
/// (asume la base siempre vacia).
/// </summary>
public class PublicCvDetalleProfesionalTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public PublicCvDetalleProfesionalTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<string> CrearCurriculumPublicadoAsync(string slugPrefix, params (string Seccion, bool Visible)[] visibilidades)
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
        };
        usuario.Curriculums.Add(curriculum);
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        foreach (var (seccion, visible) in visibilidades)
        {
            db.VisibilidadesSeccion.Add(new VisibilidadSeccion
            {
                CurriculumId = curriculum.CurriculumId,
                NombreSeccion = seccion,
                EsVisible = visible,
            });
        }
        if (visibilidades.Length > 0) await db.SaveChangesAsync();

        return slug;
    }

    private async Task<string> CrearCurriculumPublicadoConPersonalesAsync(
        string slugPrefix, params (string Seccion, bool Visible)[] visibilidades)
    {
        var slug = await CrearCurriculumPublicadoAsync(slugPrefix, visibilidades);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var curriculum = await db.Curriculums.FirstAsync(c => c.UrlPublica == slug);
        db.Personales.Add(new Personales
        {
            CurriculumId = curriculum.CurriculumId,
            PrimerNombre = "Test",
            PrimerApellido = "Usuario",
            FotoUrl = "https://example.com/foto.jpg",
            Ciudad = "Bogotá",
            Pais = "Colombia",
            Celular = "3001234567",
            Email = "contacto@example.com",
        });
        await db.SaveChangesAsync();

        return slug;
    }

    private async Task<(string Slug, byte[] Bytes)> CrearCurriculumPublicadoConFotoBinariaAsync(
        string slugPrefix, params (string Seccion, bool Visible)[] visibilidades)
    {
        var slug = await CrearCurriculumPublicadoAsync(slugPrefix, visibilidades);
        var bytesFoto = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3, 4 };

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var curriculum = await db.Curriculums.FirstAsync(c => c.UrlPublica == slug);
        db.Personales.Add(new Personales
        {
            CurriculumId = curriculum.CurriculumId,
            PrimerNombre = "Test",
            PrimerApellido = "Usuario",
            FotoBytes = bytesFoto,
            FotoContentType = "image/jpeg",
        });
        await db.SaveChangesAsync();

        return (slug, bytesFoto);
    }

    [Fact]
    public async Task GetDetalle_ConFotoBinaria_FotoUrlApuntaAlEndpointDeFoto()
    {
        var (slug, _) = await CrearCurriculumPublicadoConFotoBinariaAsync("public-foto-binaria");
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");

        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal($"/api/public/cvs/{slug}/foto", dto.GetProperty("personales").GetProperty("fotoUrl").GetString());
    }

    [Fact]
    public async Task GetFotoPersonales_ConFotoBinaria_DevuelveBytesYContentType()
    {
        var (slug, bytesFoto) = await CrearCurriculumPublicadoConFotoBinariaAsync("public-foto-get");
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}/foto");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("image/jpeg", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(bytesFoto, await response.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task GetFotoPersonales_ConVisibilidadFotoEnFalse_Retorna404()
    {
        var (slug, _) = await CrearCurriculumPublicadoConFotoBinariaAsync(
            "public-foto-oculta", ("datos-personales.foto", false));
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}/foto");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetFotoPersonales_SoloConUrlLegacySinBinario_Retorna404()
    {
        var slug = await CrearCurriculumPublicadoConPersonalesAsync("public-foto-legacy");
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}/foto");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetFotoPersonales_CvNoExiste_Retorna404()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/public/cvs/no-existe-jamas/foto");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetDetalle_SinFilasDeVisibilidad_AmbasPestanasActivasPorDefecto()
    {
        var slug = await CrearCurriculumPublicadoAsync("public-pestanas-default");
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(dto.GetProperty("informacionProfesionalPublicaActiva").GetBoolean());
        Assert.True(dto.GetProperty("hojaDeVidaPublicaActiva").GetBoolean());
    }

    [Fact]
    public async Task GetDetalle_ConVisibilidadProfesionalPublicoEnFalse_InformacionProfesionalPublicaActivaEnFalse()
    {
        var slug = await CrearCurriculumPublicadoAsync("public-profesional-off", ("profesional.publico", false));
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(dto.GetProperty("informacionProfesionalPublicaActiva").GetBoolean());
        Assert.True(dto.GetProperty("hojaDeVidaPublicaActiva").GetBoolean());
    }

    [Fact]
    public async Task GetDetalle_ConVisibilidadHojaDeVidaPublicoEnFalse_HojaDeVidaPublicaActivaEnFalse()
    {
        var slug = await CrearCurriculumPublicadoAsync("public-hoja-off", ("hoja-de-vida.publico", false));
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(dto.GetProperty("hojaDeVidaPublicaActiva").GetBoolean());
        Assert.True(dto.GetProperty("informacionProfesionalPublicaActiva").GetBoolean());
    }

    // ── Visibilidad fina de Personales (foto/ciudad-pais/email/telefono) ────────
    // Regresion del hallazgo de auditoria: FotoUrl/Ciudad/Pais viajaban siempre en
    // el JSON publico sin importar los interruptores de Configuracion (a diferencia
    // de Email/Telefono, que si los respetaban). Ver PublicCvService.MapToDetalle.

    [Fact]
    public async Task GetDetalle_SinFilasDeVisibilidad_FotoCiudadPaisEmailTelefonoVisiblesPorDefecto()
    {
        var slug = await CrearCurriculumPublicadoConPersonalesAsync("public-personales-default");
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var personales = dto.GetProperty("personales");
        Assert.Equal("https://example.com/foto.jpg", personales.GetProperty("fotoUrl").GetString());
        Assert.Equal("Bogotá", personales.GetProperty("ciudad").GetString());
        Assert.Equal("Colombia", personales.GetProperty("pais").GetString());
        Assert.Equal("3001234567", personales.GetProperty("celular").GetString());
        Assert.Equal("contacto@example.com", personales.GetProperty("email").GetString());
    }

    [Fact]
    public async Task GetDetalle_ConVisibilidadFotoEnFalse_FotoUrlNoViajaPeroElRestoSi()
    {
        var slug = await CrearCurriculumPublicadoConPersonalesAsync(
            "public-foto-off", ("datos-personales.foto", false));
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");

        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var personales = dto.GetProperty("personales");
        Assert.Equal(JsonValueKind.Null, personales.GetProperty("fotoUrl").ValueKind);
        Assert.Equal("Bogotá", personales.GetProperty("ciudad").GetString());
        Assert.Equal("contacto@example.com", personales.GetProperty("email").GetString());
    }

    [Fact]
    public async Task GetDetalle_ConVisibilidadCiudadPaisEnFalse_CiudadYPaisNoViajanPeroElRestoSi()
    {
        var slug = await CrearCurriculumPublicadoConPersonalesAsync(
            "public-ciudadpais-off", ("datos-personales.ciudad-pais", false));
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");

        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var personales = dto.GetProperty("personales");
        Assert.Equal(JsonValueKind.Null, personales.GetProperty("ciudad").ValueKind);
        Assert.Equal(JsonValueKind.Null, personales.GetProperty("pais").ValueKind);
        Assert.Equal("https://example.com/foto.jpg", personales.GetProperty("fotoUrl").GetString());
        Assert.Equal("3001234567", personales.GetProperty("celular").GetString());
    }

    [Fact]
    public async Task GetDetalle_ConVisibilidadEmailYTelefonoEnFalse_NoViajanPeroElRestoSi()
    {
        var slug = await CrearCurriculumPublicadoConPersonalesAsync(
            "public-contacto-off",
            ("datos-personales.email", false),
            ("datos-personales.telefono", false));
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");

        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var personales = dto.GetProperty("personales");
        Assert.Equal(JsonValueKind.Null, personales.GetProperty("email").ValueKind);
        Assert.Equal(JsonValueKind.Null, personales.GetProperty("celular").ValueKind);
        Assert.Equal("Bogotá", personales.GetProperty("ciudad").GetString());
        Assert.Equal("https://example.com/foto.jpg", personales.GetProperty("fotoUrl").GetString());
    }
}
