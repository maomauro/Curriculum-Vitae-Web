namespace PortalCV.Application.DTOs.Dashboard;

// ── Dashboard stats ───────────────────────────────────────────────────────────

public record DashboardStatsDto(
    int TotalVisitas,
    int TotalContactos,
    int AlertasNoLeidas,
    int PorcentajeCompletitud,
    DateTime? UltimaVisita,
    DateTime FechaActualizacion);

// ── Contactos recibidos ───────────────────────────────────────────────────────

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

// ── Notificaciones (campanita) ────────────────────────────────────────────────

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
