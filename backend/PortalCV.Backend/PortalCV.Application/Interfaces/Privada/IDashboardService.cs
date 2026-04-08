using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

public interface IDashboardService
{
    /// <summary>EstadÃ­sticas agregadas del CV del publicador (visitas, contactos, completitud).</summary>
    Task<DashboardStatsDto> GetStatsAsync(int curriculumId, CancellationToken ct = default);

    /// <summary>Lista de mensajes de contacto recibidos por el CV.</summary>
    Task<IReadOnlyList<ContactoDto>> GetContactosAsync(int curriculumId, CancellationToken ct = default);

    /// <summary>Marca un contacto especÃ­fico como leÃ­do.</summary>
    Task MarcarContactoLeidoAsync(int curriculumId, int contactoId, CancellationToken ct = default);

    /// <summary>Resumen de notificaciones para la campanita: conteo no-leÃ­das + Ãºltimas N alertas.</summary>
    Task<NotificacionesResumenDto> GetNotificacionesAsync(int curriculumId, int limite = 10, CancellationToken ct = default);
}

