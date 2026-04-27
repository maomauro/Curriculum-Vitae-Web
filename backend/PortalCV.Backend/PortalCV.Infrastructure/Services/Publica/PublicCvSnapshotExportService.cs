using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PortalCV.Application;
using PortalCV.Application.DTOs.Publica;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public sealed class PublicCvSnapshotExportService : IPublicCvSnapshotExportService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = true,
    };

    private readonly PortalCvDbContext _db;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PublicCvSnapshotExportService> _logger;

    public PublicCvSnapshotExportService(
        PortalCvDbContext db,
        IServiceScopeFactory scopeFactory,
        ILogger<PublicCvSnapshotExportService> logger)
    {
        _db = db;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <summary>
    /// Publicar/actualizar datos y despublicar tocan tablas de export en un <b>nuevo scope</b> con otro
    /// <see cref="PortalCvDbContext"/>: el contexto del <see cref="CvEditorService"/> acaba de guardar el CV y
    /// las lecturas/escrituras del export deben ver el estado ya confirmado en SQL.
    /// </summary>
    public async Task NotifyCurriculumDataChangedAsync(int curriculumId, CancellationToken ct = default)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var pubCv = scope.ServiceProvider.GetRequiredService<IPublicCvService>();

        await UpsertExportRowAsync(db, pubCv, curriculumId, _logger, ct);
        await MarkSiteSnapshotStaleAsync(db, ct);
    }

    public async Task NotifyPublicationChangedAsync(int curriculumId, bool isNowPublished, CancellationToken ct = default)
    {
        _ = isNowPublished;
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
        var pubCv = scope.ServiceProvider.GetRequiredService<IPublicCvService>();

        // Conservamos el snapshot incluso en borrador; el estado se filtra al consolidar export público.
        await UpsertExportRowAsync(db, pubCv, curriculumId, _logger, ct);

        await MarkSiteSnapshotStaleAsync(db, ct);
    }

    public async Task<bool> IsStaticSnapshotStaleAsync(CancellationToken ct = default)
    {
        var row = await _db.PublicStaticSnapshotState.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == 1, ct);
        return row?.SiteSnapshotStale ?? false;
    }

    public async Task<byte[]> BuildConsolidatedSnapshotJsonUtf8Async(CancellationToken ct = default)
    {
        var rows = await (
            from exportRow in _db.PublicCvSnapshotExports.AsNoTracking()
            join curriculum in _db.Curriculums.AsNoTracking()
                on exportRow.CurriculumId equals curriculum.CurriculumId
            where curriculum.Estado == CurriculumEstados.Publicado
                && curriculum.Usuario.Estado == UsuarioEstados.Activo
            orderby exportRow.CurriculumId
            select exportRow
        )
            .ToListAsync(ct);

        var items = new List<PublicSnapshotItemDto>(rows.Count);
        foreach (var row in rows)
        {
            try
            {
                var item = JsonSerializer.Deserialize<PublicSnapshotItemDto>(row.ItemJson, JsonOptions);
                if (item is not null) items.Add(item);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Export JSON inválido para CurriculumId={CurriculumId}", row.CurriculumId);
            }
        }

        var snapshot = new PublicCvsSnapshotDto(
            DateTime.UtcNow,
            "admin-static-export-v1",
            items);

        var json = JsonSerializer.Serialize(snapshot, JsonOptions);
        return Encoding.UTF8.GetBytes(json);
    }

    public async Task AcknowledgeStaticSnapshotPublishedAsync(CancellationToken ct = default)
    {
        var row = await _db.PublicStaticSnapshotState.FirstOrDefaultAsync(x => x.Id == 1, ct);
        if (row is null)
            _db.PublicStaticSnapshotState.Add(new PublicStaticSnapshotState { Id = 1, SiteSnapshotStale = false });
        else
            row.SiteSnapshotStale = false;

        await _db.SaveChangesAsync(ct);
    }

    private static async Task UpsertExportRowAsync(
        PortalCvDbContext db,
        IPublicCvService publicCv,
        int curriculumId,
        ILogger logger,
        CancellationToken ct)
    {
        var item = await publicCv.TryBuildSnapshotItemDtoAsync(curriculumId, ct);
        if (item is null)
        {
            logger.LogWarning(
                "PublicCvSnapshotExport: no se pudo construir el item para CurriculumId={CurriculumId} " +
                "(CV no encontrado o inconsistente). No se escribe fila en PublicCvSnapshotExport.",
                curriculumId);
            await RemoveExportRowIfExistsAsync(db, curriculumId, ct);
            return;
        }

        string json;
        try
        {
            json = JsonSerializer.Serialize(item, JsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "PublicCvSnapshotExport: fallo al serializar el snapshot para CurriculumId={CurriculumId}", curriculumId);
            throw;
        }

        var now = DateTime.UtcNow;
        var existing = await db.PublicCvSnapshotExports.FindAsync(new object[] { curriculumId }, ct);
        if (existing is null)
        {
            db.PublicCvSnapshotExports.Add(new PublicCvSnapshotExport
            {
                CurriculumId = curriculumId,
                ItemJson = json,
                UpdatedAtUtc = now,
            });
        }
        else
        {
            existing.ItemJson = json;
            existing.UpdatedAtUtc = now;
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation(
            "PublicCvSnapshotExport: guardado CurriculumId={CurriculumId} JsonLength={Length} (insert o update).",
            curriculumId,
            json.Length);
    }

    private static async Task RemoveExportRowIfExistsAsync(PortalCvDbContext db, int curriculumId, CancellationToken ct)
    {
        var row = await db.PublicCvSnapshotExports.FindAsync(new object[] { curriculumId }, ct);
        if (row is null) return;
        db.PublicCvSnapshotExports.Remove(row);
        await db.SaveChangesAsync(ct);
    }

    private static async Task MarkSiteSnapshotStaleAsync(PortalCvDbContext db, CancellationToken ct)
    {
        var row = await db.PublicStaticSnapshotState.FirstOrDefaultAsync(x => x.Id == 1, ct);
        if (row is null)
            db.PublicStaticSnapshotState.Add(new PublicStaticSnapshotState { Id = 1, SiteSnapshotStale = true });
        else
            row.SiteSnapshotStale = true;

        await db.SaveChangesAsync(ct);
    }
}
