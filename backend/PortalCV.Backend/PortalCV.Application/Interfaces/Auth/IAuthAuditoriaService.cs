using PortalCV.Application.DTOs.Admin;
using PortalCV.Application.DTOs.Auth;

namespace PortalCV.Application.Interfaces;

public interface IAuthAuditoriaService
{
    Task RegistrarAsync(
        int? actorUsuarioId,
        string accion,
        string email,
        IReadOnlyDictionary<string, string>? detalle,
        CancellationToken ct = default);

    Task<(IReadOnlyList<AuditoriaAuthListItemDto> Items, int Total)> ListarAsync(
        int page,
        int pageSize,
        string? accionFiltro = null,
        string? q = null,
        CancellationToken ct = default);

    /// <returns>Filas eliminadas.</returns>
    Task<int> PurgeAsync(AuditoriaPurgeModo modo, int? anio, int? mes, CancellationToken ct = default);
}
