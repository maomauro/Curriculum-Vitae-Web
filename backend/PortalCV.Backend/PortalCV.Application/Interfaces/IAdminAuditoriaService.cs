using PortalCV.Application.DTOs.Admin;

namespace PortalCV.Application.Interfaces;

public interface IAdminAuditoriaService
{
    Task RegistrarAsync(
        int? actorUsuarioId,
        string accion,
        string entidadTipo,
        int? entidadId,
        IReadOnlyDictionary<string, string>? detalle,
        CancellationToken ct = default);

    Task<(IReadOnlyList<AuditoriaAdminListItemDto> Items, int Total)> ListarAsync(
        int page,
        int pageSize,
        string? accionFiltro = null,
        string? q = null,
        CancellationToken ct = default);

    /// <returns>Filas eliminadas.</returns>
    Task<int> PurgeAsync(AuditoriaPurgeModo modo, int? anio, int? mes, CancellationToken ct = default);
}
