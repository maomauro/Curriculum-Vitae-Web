using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PortalCV.Application;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Api.Tests;

/// <summary>
/// Interruptores MostrarExperienciaPerfil/MostrarAspiracionSalarial de Perfil: control
/// por cada perfil (reemplazan el interruptor global que antes vivía en Configuración,
/// ver script 26_AddPerfilVisibilidadPorPerfil.sql). En clase propia por el mismo motivo
/// que PublicCvAdjuntosTests: publicar un CV rompe el test que asume la base de
/// PublicEndpointsTests siempre vacía.
/// </summary>
public class PublicCvPerfilVisibilidadTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public PublicCvPerfilVisibilidadTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<(string Slug, int PerfilId)> CrearCurriculumPublicadoConPerfilAsync(
        string slugPrefix, bool mostrarExperiencia, bool mostrarAspiracionSalarial)
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

        var perfil = new Perfil
        {
            CurriculumId = curriculum.CurriculumId,
            NombrePerfil = "Backend Developer",
            ExperienciaPerfilAnios = 7,
            AspiracionSalarialPesos = 8000000,
            AspiracionSalarialDolares = 2000,
            EsActivo = true,
            MostrarExperienciaPerfil = mostrarExperiencia,
            MostrarAspiracionSalarial = mostrarAspiracionSalarial,
        };
        db.Perfiles.Add(perfil);
        await db.SaveChangesAsync();

        return (slug, perfil.PerfilId);
    }

    [Fact]
    public async Task GetDetalle_PorDefecto_MuestraExperienciaYAspiracionDelPerfil()
    {
        var (slug, _) = await CrearCurriculumPublicadoConPerfilAsync("public-perfil-default", true, true);
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var perfil = dto.GetProperty("perfiles").EnumerateArray().First();

        Assert.Equal(7, perfil.GetProperty("experienciaPerfilAnios").GetDecimal());
        Assert.Equal(8000000, perfil.GetProperty("aspiracionSalarialPesos").GetDecimal());
        Assert.Equal(2000, perfil.GetProperty("aspiracionSalarialDolares").GetDecimal());
    }

    [Fact]
    public async Task GetDetalle_ConMostrarExperienciaPerfilEnFalse_OcultaSoloLaExperiencia()
    {
        var (slug, _) = await CrearCurriculumPublicadoConPerfilAsync("public-perfil-sin-exp", false, true);
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var perfil = dto.GetProperty("perfiles").EnumerateArray().First();

        Assert.Equal(JsonValueKind.Null, perfil.GetProperty("experienciaPerfilAnios").ValueKind);
        Assert.Equal(8000000, perfil.GetProperty("aspiracionSalarialPesos").GetDecimal());
    }

    [Fact]
    public async Task GetDetalle_ConMostrarAspiracionSalarialEnFalse_OcultaPesosYDolares()
    {
        var (slug, _) = await CrearCurriculumPublicadoConPerfilAsync("public-perfil-sin-salario", true, false);
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/public/cvs/{slug}");
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var perfil = dto.GetProperty("perfiles").EnumerateArray().First();

        Assert.Equal(7, perfil.GetProperty("experienciaPerfilAnios").GetDecimal());
        Assert.Equal(JsonValueKind.Null, perfil.GetProperty("aspiracionSalarialPesos").ValueKind);
        Assert.Equal(JsonValueKind.Null, perfil.GetProperty("aspiracionSalarialDolares").ValueKind);
    }
}
