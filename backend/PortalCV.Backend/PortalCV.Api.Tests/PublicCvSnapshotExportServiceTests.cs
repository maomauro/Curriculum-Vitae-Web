using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using PortalCV.Application.DTOs.Publica;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;
using PortalCV.Infrastructure.Services;

namespace PortalCV.Api.Tests;

/// <summary>
/// Cubre PublicCvSnapshotExportService de forma aislada (sin WebApplicationFactory):
/// construye el servicio directo sobre un DbContext InMemory y un IPublicCvService
/// de prueba, para poder forzar tanto el camino feliz como el catch-and-log de
/// NotifyCurriculumDataChangedAsync/NotifyPublicationChangedAsync (fallo no bloqueante).
/// </summary>
public class PublicCvSnapshotExportServiceTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private sealed class FakePublicCvService : IPublicCvService
    {
        private readonly Func<int, PublicSnapshotItemDto?> _builder;
        public FakePublicCvService(Func<int, PublicSnapshotItemDto?> builder) => _builder = builder;

        public Task<(IReadOnlyList<CvListadoItemDto> Items, int Total)> BuscarCvsAsync(BuscarCvsQuery query, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<CvDetalleDto?> GetDetalleAsync(string urlPublica, string? visitanteAnonimoId = null, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<CvEstadisticasDto?> GetEstadisticasAsync(string urlPublica, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<FiltrosPublicosDto> GetFiltrosAsync(CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task ContactarAsync(string urlPublica, ContactarCvRequest request, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task RegistrarImpresionPdfAsync(string urlPublica, string? visitanteAnonimoId = null, CancellationToken ct = default)
            => throw new NotSupportedException();

        public Task<PublicSnapshotItemDto?> TryBuildSnapshotItemDtoAsync(int curriculumId, CancellationToken ct = default)
            => Task.FromResult(_builder(curriculumId));
    }

    private static (PortalCvDbContext Db, PublicCvSnapshotExportService Service) CreateService(Func<int, PublicSnapshotItemDto?> builder)
    {
        var dbName = $"PublicSnapshotExport-Tests-{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<PortalCvDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<IPublicCvService>(_ => new FakePublicCvService(builder));
        var provider = services.BuildServiceProvider();

        var db = provider.GetRequiredService<PortalCvDbContext>();
        var scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();
        var service = new PublicCvSnapshotExportService(db, scopeFactory, NullLogger<PublicCvSnapshotExportService>.Instance);
        return (db, service);
    }

    private static PublicSnapshotItemDto BuildItem(int curriculumId) => new(
        new CvListadoItemDto(curriculumId, $"cv-{curriculumId}", null, null, null, null, null, 0, 0, Array.Empty<string>()),
        new CvDetalleDto(curriculumId, $"cv-{curriculumId}", "clasico", 0, null,
            Array.Empty<PerfilPublicoDto>(), Array.Empty<ExperienciaPublicoDto>(), Array.Empty<FormacionPublicoDto>(),
            Array.Empty<HabilidadPublicoDto>(), Array.Empty<ProyectoPublicoDto>(), Array.Empty<ReferenciaPublicoDto>(),
            Array.Empty<RedSocialPublicoDto>(), true, true, true),
        null);

    [Fact]
    public async Task NotifyCurriculumDataChangedAsync_ItemValido_GuardaFilaYMarcaSnapshotDesactualizado()
    {
        var (db, service) = CreateService(id => BuildItem(id));

        await service.NotifyCurriculumDataChangedAsync(42);

        var row = await db.PublicCvSnapshotExports.AsNoTracking().SingleAsync(x => x.CurriculumId == 42);
        Assert.Contains("cv-42", row.ItemJson);

        var stale = await db.PublicStaticSnapshotState.AsNoTracking().SingleAsync(x => x.Id == 1);
        Assert.True(stale.SiteSnapshotStale);
    }

    [Fact]
    public async Task NotifyCurriculumDataChangedAsync_ItemNulo_EliminaFilaExistente()
    {
        var (db, service) = CreateService(_ => null);
        db.PublicCvSnapshotExports.Add(new PublicCvSnapshotExport { CurriculumId = 7, ItemJson = "{}", UpdatedAtUtc = DateTime.UtcNow });
        await db.SaveChangesAsync();

        await service.NotifyCurriculumDataChangedAsync(7);

        Assert.False(await db.PublicCvSnapshotExports.AsNoTracking().AnyAsync(x => x.CurriculumId == 7));
    }

    [Fact]
    public async Task NotifyCurriculumDataChangedAsync_FalloAlConstruirItem_NoLanzaExcepcion()
    {
        var (_, service) = CreateService(_ => throw new InvalidOperationException("boom"));

        var ex = await Record.ExceptionAsync(() => service.NotifyCurriculumDataChangedAsync(1));

        Assert.Null(ex);
    }

    [Fact]
    public async Task NotifyPublicationChangedAsync_ItemValido_GuardaFila()
    {
        var (db, service) = CreateService(id => BuildItem(id));

        await service.NotifyPublicationChangedAsync(5, isNowPublished: true);

        Assert.True(await db.PublicCvSnapshotExports.AsNoTracking().AnyAsync(x => x.CurriculumId == 5));
    }

    [Fact]
    public async Task NotifyPublicationChangedAsync_FalloAlConstruirItem_NoLanzaExcepcion()
    {
        var (_, service) = CreateService(_ => throw new InvalidOperationException("boom"));

        var ex = await Record.ExceptionAsync(() => service.NotifyPublicationChangedAsync(1, isNowPublished: false));

        Assert.Null(ex);
    }

    [Fact]
    public async Task IsStaticSnapshotStaleAsync_SinFila_DevuelveFalse()
    {
        var (_, service) = CreateService(_ => null);

        Assert.False(await service.IsStaticSnapshotStaleAsync());
    }

    [Fact]
    public async Task AcknowledgeStaticSnapshotPublishedAsync_LimpiaFlagStale()
    {
        var (_, service) = CreateService(id => BuildItem(id));
        await service.NotifyCurriculumDataChangedAsync(9);
        Assert.True(await service.IsStaticSnapshotStaleAsync());

        await service.AcknowledgeStaticSnapshotPublishedAsync();

        Assert.False(await service.IsStaticSnapshotStaleAsync());
    }

    [Fact]
    public async Task BuildConsolidatedSnapshotJsonUtf8Async_SoloPublicadosActivosYJsonValido()
    {
        var (db, service) = CreateService(id => BuildItem(id));

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

        var bytes = await service.BuildConsolidatedSnapshotJsonUtf8Async();
        var json = Encoding.UTF8.GetString(bytes);

        Assert.Contains($"cv-{cvValido.CurriculumId}", json);
        Assert.DoesNotContain($"cv-{cvCorrupto.CurriculumId}", json);
        Assert.DoesNotContain($"cv-{cvBorrador.CurriculumId}", json);
    }
}
