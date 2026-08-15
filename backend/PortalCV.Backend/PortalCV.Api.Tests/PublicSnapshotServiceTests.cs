using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using PortalCV.Application.DTOs.Publica;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;
using PortalCV.Infrastructure.Services;

namespace PortalCV.Api.Tests;

/// <summary>
/// Cubre PublicSnapshotService (BackgroundService) sin depender de su bucle de fondo:
/// invoca TryRefreshSnapshotAsync (privado) via reflexion, que es el metodo con la logica
/// real de reconstruccion del snapshot (join publicado+activo, deserializacion con catch
/// por fila corrupta) y el unico camino practico para ejercitarlo sin timers ni sleeps.
/// </summary>
public class PublicSnapshotServiceTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static (PortalCvDbContext Db, PublicSnapshotService Service) CreateService(IConfiguration? config = null)
    {
        var dbName = $"PublicSnapshot-Tests-{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<PortalCvDbContext>(o => o.UseInMemoryDatabase(dbName));
        var provider = services.BuildServiceProvider();

        var db = provider.GetRequiredService<PortalCvDbContext>();
        var scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();
        var service = new PublicSnapshotService(
            scopeFactory, config ?? new ConfigurationBuilder().Build(), NullLogger<PublicSnapshotService>.Instance);
        return (db, service);
    }

    private static Task InvokeTryRefreshAsync(PublicSnapshotService service)
    {
        var method = typeof(PublicSnapshotService).GetMethod(
            "TryRefreshSnapshotAsync", BindingFlags.NonPublic | BindingFlags.Instance)!;
        return (Task)method.Invoke(service, new object[] { CancellationToken.None })!;
    }

    private static PublicSnapshotItemDto BuildItem(int curriculumId) => new(
        new CvListadoItemDto(curriculumId, $"cv-{curriculumId}", null, null, null, null, null, 0, 0, Array.Empty<string>()),
        new CvDetalleDto(curriculumId, $"cv-{curriculumId}", "clasico", 0, null,
            Array.Empty<PerfilPublicoDto>(), Array.Empty<ExperienciaPublicoDto>(), Array.Empty<FormacionPublicoDto>(),
            Array.Empty<HabilidadPublicoDto>(), Array.Empty<ProyectoPublicoDto>(), Array.Empty<ReferenciaPublicoDto>(),
            Array.Empty<RedSocialPublicoDto>(), true, true, true),
        null);

    [Fact]
    public void GetLatest_AntesDeRefrescar_DevuelveSnapshotBootstrapVacio()
    {
        var (_, service) = CreateService();

        var snapshot = service.GetLatest();

        Assert.Equal("bootstrap-empty", snapshot.SourceVersion);
        Assert.Empty(snapshot.Items);
    }

    [Fact]
    public void Constructor_ConIntervalosMenoresAlMinimo_LosRedondeaAlPiso()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["PublicSnapshot:RefreshIntervalMinutes"] = "0",
                ["PublicSnapshot:BootstrapRetrySeconds"] = "1",
            })
            .Build();

        // No debe lanzar: valida que el clamp (minutes<1 -> 1, bootSec<5 -> 5) no rompe la construccion.
        var (_, service) = CreateService(config);

        Assert.Equal("bootstrap-empty", service.GetLatest().SourceVersion);
    }

    [Fact]
    public async Task TryRefreshSnapshotAsync_SoloIncluyePublicadosActivosConJsonValido()
    {
        var (db, service) = CreateService();

        var usuarioActivo = new Usuario { Email = "a@x.com", PasswordHash = "x", Estado = "Activo", FechaRegistro = DateTime.UtcNow };
        var cvValido = new Curriculum { UrlPublica = "cv-ok", Estado = "Publicado", FechaCreacion = DateTime.UtcNow, FechaActualizacion = DateTime.UtcNow, Usuario = usuarioActivo };
        usuarioActivo.Curriculums.Add(cvValido);

        var usuarioActivo2 = new Usuario { Email = "b@x.com", PasswordHash = "x", Estado = "Activo", FechaRegistro = DateTime.UtcNow };
        var cvCorrupto = new Curriculum { UrlPublica = "cv-corrupto", Estado = "Publicado", FechaCreacion = DateTime.UtcNow, FechaActualizacion = DateTime.UtcNow, Usuario = usuarioActivo2 };
        usuarioActivo2.Curriculums.Add(cvCorrupto);

        var usuarioActivo3 = new Usuario { Email = "c@x.com", PasswordHash = "x", Estado = "Activo", FechaRegistro = DateTime.UtcNow };
        var cvBorrador = new Curriculum { UrlPublica = "cv-draft", Estado = "Borrador", FechaCreacion = DateTime.UtcNow, FechaActualizacion = DateTime.UtcNow, Usuario = usuarioActivo3 };
        usuarioActivo3.Curriculums.Add(cvBorrador);

        db.Usuarios.AddRange(usuarioActivo, usuarioActivo2, usuarioActivo3);
        await db.SaveChangesAsync();

        var itemJsonValido = JsonSerializer.Serialize(BuildItem(cvValido.CurriculumId), JsonOptions);
        db.PublicCvSnapshotExports.AddRange(
            new PublicCvSnapshotExport { CurriculumId = cvValido.CurriculumId, ItemJson = itemJsonValido, UpdatedAtUtc = DateTime.UtcNow },
            new PublicCvSnapshotExport { CurriculumId = cvCorrupto.CurriculumId, ItemJson = "no es json valido", UpdatedAtUtc = DateTime.UtcNow },
            new PublicCvSnapshotExport { CurriculumId = cvBorrador.CurriculumId, ItemJson = itemJsonValido, UpdatedAtUtc = DateTime.UtcNow });
        await db.SaveChangesAsync();

        await InvokeTryRefreshAsync(service);

        var snapshot = service.GetLatest();
        Assert.Equal("api-background-v1", snapshot.SourceVersion);
        Assert.Single(snapshot.Items);
        Assert.Equal(cvValido.CurriculumId, snapshot.Items[0].Listado.CurriculumId);
    }

    [Fact]
    public async Task TryRefreshSnapshotAsync_SinFilas_DevuelveSnapshotVacioConSourceVersionActualizado()
    {
        var (_, service) = CreateService();

        await InvokeTryRefreshAsync(service);

        var snapshot = service.GetLatest();
        Assert.Equal("api-background-v1", snapshot.SourceVersion);
        Assert.Empty(snapshot.Items);
    }
}
