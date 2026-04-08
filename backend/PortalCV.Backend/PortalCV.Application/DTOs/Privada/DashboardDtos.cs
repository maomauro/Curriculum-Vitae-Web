namespace PortalCV.Application.DTOs.Privada;

// â”€â”€ Dashboard stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

public record DashboardStatsDto(
    int TotalVisitas,
    int TotalContactos,
    int AlertasNoLeidas,
    int PorcentajeCompletitud,
    DateTime? UltimaVisita,
    DateTime FechaActualizacion);

// â”€â”€ Contactos recibidos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

public record ContactoDto(
    int VisitanteContactoId,
    string? Nombre,
    string Correo,
    string? Empresa,
    string? MotivoContacto,
    string? Asunto,
    string? Mensaje,
    DateTime FechaContacto,
    bool EsLeido);

// â”€â”€ Notificaciones (campanita) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

public record NotificacionItemDto(
    int AlertaVisitaId,
    string? TipoVisita,
    string? Titulo,
    string? Descripcion,
    bool EsLeida,
    DateTime FechaVisita);

public record NotificacionesResumenDto(
    int ConteoNoLeidas,
    IReadOnlyList<NotificacionItemDto> Recientes);

