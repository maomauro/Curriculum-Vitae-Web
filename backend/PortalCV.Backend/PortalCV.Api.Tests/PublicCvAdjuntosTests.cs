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
/// Tests del soporte binario (PDF) de Experiencia y Formacion en el CV publico: la
/// URL de descarga solo debe viajar en el JSON cuando el visitante tiene permiso de
/// verla (mismo tipo de gate que ya existe para Email/Telefono/Foto de Personales),
/// y el endpoint de descarga debe respetar exactamente el mismo criterio. En clase
/// propia por el mismo motivo que PublicCvDetalleProfesionalTests: publicar un CV
/// rompe el test que asume la base de PublicEndpointsTests siempre vacia.
/// </summary>
public class PublicCvAdjuntosTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private static readonly byte[] PdfBytesDePrueba = { 0x25, 0x50, 0x44, 0x46, 1, 2, 3 };

    public PublicCvAdjuntosTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<(string Slug, int CurriculumId)> CrearCurriculumPublicadoAsync(
        string slugPrefix, params (string Seccion, bool Visible)[] visibilidades)
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

        return (slug, curriculum.CurriculumId);
    }

    private async Task<int> AgregarExperienciaConAdjuntoAsync(int curriculumId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var e = new Experiencia
        {
            CurriculumId = curriculumId,
            Empresa = "Acme",
            EsActual = true,
            MostrarEnCv = true,
            AdjuntoSoporteBytes = PdfBytesDePrueba,
            AdjuntoSoporteContentType = "application/pdf",
            FechaRegistro = DateTime.UtcNow,
        };
        db.Experiencias.Add(e);
        await db.SaveChangesAsync();
        return e.ExperienciaId;
    }

    private async Task<int> AgregarFormacionConAdjuntoAsync(int curriculumId, string tipoFormacion)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var f = new Formacion
        {
            CurriculumId = curriculumId,
            Titulo = "Curso X",
            TipoFormacion = tipoFormacion,
            MostrarEnCv = true,
            AdjuntoSoporteBytes = PdfBytesDePrueba,
            AdjuntoSoporteContentType = "application/pdf",
        };
        db.Formaciones.Add(f);
        await db.SaveChangesAsync();
        return f.FormacionId;
    }

    // ── Experiencia ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetDetalle_ConAdjuntoExperiencia_VisibleEnCvPorDefecto()
    {
        var (slug, curriculumId) = await CrearCurriculumPublicadoAsync("public-exp-adjunto-default");
        var expId = await AgregarExperienciaConAdjuntoAsync(curriculumId);
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var exp = dto.GetProperty("experiencias").EnumerateArray().First();

        Assert.Equal($"/api/public/cvs/{slug}/experiencias/{expId}/adjunto", exp.GetProperty("adjuntoSoporte").GetString());
    }

    [Fact]
    public async Task GetAdjuntoExperiencia_PorDefecto_Retorna200ConElPdf()
    {
        var (slug, curriculumId) = await CrearCurriculumPublicadoAsync("public-exp-adjunto-get");
        var expId = await AgregarExperienciaConAdjuntoAsync(curriculumId);
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}/experiencias/{expId}/adjunto");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(PdfBytesDePrueba, await response.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task GetDetalleYGetAdjunto_ConVisibilidadSoporteExperienciaEnFalse_NoViajaNiDescarga()
    {
        var (slug, curriculumId) = await CrearCurriculumPublicadoAsync(
            "public-exp-adjunto-oculto", ("experiencia.soporte-certificacion-laboral", false));
        var expId = await AgregarExperienciaConAdjuntoAsync(curriculumId);
        var client = _factory.CreateClient();

        var detalleResponse = await client.GetAsync($"/api/public/cvs/{slug}");
        var dto = await detalleResponse.Content.ReadFromJsonAsync<JsonElement>();
        var exp = dto.GetProperty("experiencias").EnumerateArray().First();
        Assert.Equal(JsonValueKind.Null, exp.GetProperty("adjuntoSoporte").ValueKind);

        var adjuntoResponse = await client.GetAsync($"/api/public/cvs/{slug}/experiencias/{expId}/adjunto");
        Assert.Equal(HttpStatusCode.NotFound, adjuntoResponse.StatusCode);
    }

    // ── Formación ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetDetalle_ConAdjuntoFormacionDiplomado_VisiblePorDefecto()
    {
        var (slug, curriculumId) = await CrearCurriculumPublicadoAsync("public-form-adjunto-default");
        var formId = await AgregarFormacionConAdjuntoAsync(curriculumId, "Diplomado");
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var form = dto.GetProperty("formaciones").EnumerateArray().First();

        Assert.Equal($"/api/public/cvs/{slug}/formaciones/{formId}/adjunto", form.GetProperty("adjuntoSoporte").GetString());
    }

    [Fact]
    public async Task GetDetalleYGetAdjunto_ConBloqueDiplomadosEnFalse_NoViajaNiDescarga()
    {
        var (slug, curriculumId) = await CrearCurriculumPublicadoAsync(
            "public-form-adjunto-bloque-off", ("diplomados", false));
        var formId = await AgregarFormacionConAdjuntoAsync(curriculumId, "Diplomado");
        var client = _factory.CreateClient();

        var detalleResponse = await client.GetAsync($"/api/public/cvs/{slug}");
        var dto = await detalleResponse.Content.ReadFromJsonAsync<JsonElement>();
        var form = dto.GetProperty("formaciones").EnumerateArray().First();
        Assert.Equal(JsonValueKind.Null, form.GetProperty("adjuntoSoporte").ValueKind);

        var adjuntoResponse = await client.GetAsync($"/api/public/cvs/{slug}/formaciones/{formId}/adjunto");
        Assert.Equal(HttpStatusCode.NotFound, adjuntoResponse.StatusCode);
    }

    [Fact]
    public async Task GetDetalle_FormacionAcademicaConBloqueEnFalse_AdjuntoSigueVisible()
    {
        // "formacion-academica" es siempre-visible a nivel de bloque (mismo criterio que
        // VisibilidadSeccionResolver.seccionSiempreVisible en el frontend) -- apagar la fila
        // del bloque no debe ocultar el adjunto de un Pregrado/Posgrado/etc.
        var (slug, curriculumId) = await CrearCurriculumPublicadoAsync(
            "public-form-academica-bloque-off", ("formacion-academica", false));
        var formId = await AgregarFormacionConAdjuntoAsync(curriculumId, "Pregrado");
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var form = dto.GetProperty("formaciones").EnumerateArray().First();

        Assert.Equal($"/api/public/cvs/{slug}/formaciones/{formId}/adjunto", form.GetProperty("adjuntoSoporte").GetString());
    }

    [Fact]
    public async Task GetDetalle_FormacionAcademicaConAtributoDescargarSoporteEnFalse_AdjuntoNoViaja()
    {
        // El bloque "formacion-academica" es siempre-visible, pero el atributo puntual
        // "formacion-academica.descargar-soporte" es independiente y si puede apagarse.
        var (slug, curriculumId) = await CrearCurriculumPublicadoAsync(
            "public-form-academica-attr-off", ("formacion-academica.descargar-soporte", false));
        var formId = await AgregarFormacionConAdjuntoAsync(curriculumId, "Pregrado");
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var form = dto.GetProperty("formaciones").EnumerateArray().First();

        Assert.Equal(JsonValueKind.Null, form.GetProperty("adjuntoSoporte").ValueKind);
    }

    [Fact]
    public async Task GetDetalle_CertificacionSinFilaPropia_HeredaDeEducacionEnFalse()
    {
        // "certificaciones" no tiene fila propia -> hereda del interruptor general "educacion".
        var (slug, curriculumId) = await CrearCurriculumPublicadoAsync(
            "public-form-cert-hereda-educacion", ("educacion", false));
        var formId = await AgregarFormacionConAdjuntoAsync(curriculumId, "Certificacion");
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var form = dto.GetProperty("formaciones").EnumerateArray().First();

        Assert.Equal(JsonValueKind.Null, form.GetProperty("adjuntoSoporte").ValueKind);
    }

    [Fact]
    public async Task GetDetalle_CertificacionConFilaPropiaEnTrue_IgnoraEducacionEnFalse()
    {
        // Una fila propia para el bloque especifico gana sobre el fallback a "educacion".
        var (slug, curriculumId) = await CrearCurriculumPublicadoAsync(
            "public-form-cert-fila-propia", ("educacion", false), ("certificaciones", true));
        var formId = await AgregarFormacionConAdjuntoAsync(curriculumId, "Certificacion");
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var form = dto.GetProperty("formaciones").EnumerateArray().First();

        Assert.Equal($"/api/public/cvs/{slug}/formaciones/{formId}/adjunto", form.GetProperty("adjuntoSoporte").GetString());
    }
}
