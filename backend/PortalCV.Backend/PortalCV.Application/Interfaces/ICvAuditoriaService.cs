using PortalCV.Application.DTOs.Admin;
using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

public interface ICvAuditoriaService
{
    Task RegistrarAsync(
        int? actorUsuarioId,
        int curriculumId,
        string accion,
        string entidadTipo,
        int? entidadId,
        IReadOnlyDictionary<string, string>? detalle,
        CancellationToken ct = default);

    /// <summary>Todos los eventos de edición de CV (solo uso desde rol Admin).</summary>
    Task<(IReadOnlyList<AuditoriaCvListItemDto> Items, int Total)> ListarGlobalAsync(
        int page,
        int pageSize,
        string? accionFiltro = null,
        string? q = null,
        CancellationToken ct = default);

    /// <returns>Filas eliminadas.</returns>
    Task<int> PurgeAsync(AuditoriaPurgeModo modo, int? anio, int? mes, CancellationToken ct = default);
}
