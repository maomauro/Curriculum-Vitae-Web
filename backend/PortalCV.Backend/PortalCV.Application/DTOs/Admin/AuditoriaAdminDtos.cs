namespace PortalCV.Application.DTOs.Admin;

public class AuditoriaAdminListItemDto
{
    public int AuditoriaAdminId { get; set; }
    public DateTime FechaUtc { get; set; }
    public int? ActorUsuarioId { get; set; }
    public string? ActorEmail { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string EntidadTipo { get; set; } = string.Empty;
    public int? EntidadId { get; set; }
    public string? DetalleJson { get; set; }
}
