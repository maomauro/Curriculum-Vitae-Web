namespace PortalCV.Application.Interfaces;

/// <summary>Mantiene filas de export por CV y el flag global de snapshot estático desactualizado.</summary>
public interface IPublicCvSnapshotExportService
{
    /// <summary>Tras mutar datos del CV: actualiza/crea el JSON export y marca el sitio como stale.</summary>
    Task NotifyCurriculumDataChangedAsync(int curriculumId, CancellationToken ct = default);

    /// <summary>Tras cambio de publicación: refresca el export y marca stale; la visibilidad pública se filtra al consolidar.</summary>
    Task NotifyPublicationChangedAsync(int curriculumId, bool isNowPublished, CancellationToken ct = default);

    Task<bool> IsStaticSnapshotStaleAsync(CancellationToken ct = default);

    /// <summary>JSON consolidado (mismo contrato que el snapshot público) UTF-8 para reemplazar public-cvs-snapshot.json en el repo.</summary>
    Task<byte[]> BuildConsolidatedSnapshotJsonUtf8Async(CancellationToken ct = default);

    /// <summary>Tras desplegar/commit del JSON estático: limpia el flag stale.</summary>
    Task AcknowledgeStaticSnapshotPublishedAsync(CancellationToken ct = default);
}
