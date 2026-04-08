using PortalCV.Application.DTOs.Dashboard;

namespace PortalCV.Application.Interfaces;

public interface IDashboardService
{
    /// <summary>Estadísticas agregadas del CV del publicador (visitas, contactos, completitud).</summary>
    Task<DashboardStatsDto> GetStatsAsync(int curriculumId, CancellationToken ct = default);

    /// <summary>Lista de mensajes de contacto recibidos por el CV.</summary>
    Task<IReadOnlyList<ContactoDto>> GetContactosAsync(int curriculumId, CancellationToken ct = default);

    /// <summary>Marca un contacto específico como leído.</summary>
    Task MarcarContactoLeidoAsync(int curriculumId, int contactoId, CancellationToken ct = default);

    /// <summary>Resumen de notificaciones para la campanita: conteo no-leídas + últimas N alertas.</summary>
    Task<NotificacionesResumenDto> GetNotificacionesAsync(int curriculumId, int limite = 10, CancellationToken ct = default);
}
