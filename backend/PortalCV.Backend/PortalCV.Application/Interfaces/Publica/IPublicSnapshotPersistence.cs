using PortalCV.Application.DTOs.Publica;

namespace PortalCV.Application.Interfaces;

/// <summary>
/// Almacenamiento opcional del snapshot público (p. ej. Azure Blob) para sobrevivir a reinicios de contenedor.
/// </summary>
public interface IPublicSnapshotPersistence
{
    /// <summary>Carga el último snapshot persistido; null si no existe o está desactivado.</summary>
    Task<PublicCvsSnapshotDto?> TryLoadAsync(CancellationToken ct = default);

    /// <summary>Persiste el snapshot tras un refresco exitoso desde DB.</summary>
    Task TrySaveAsync(PublicCvsSnapshotDto snapshot, CancellationToken ct = default);
}
