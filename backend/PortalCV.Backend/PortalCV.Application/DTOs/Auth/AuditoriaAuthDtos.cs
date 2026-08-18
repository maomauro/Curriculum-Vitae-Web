namespace PortalCV.Application.DTOs.Auth;

public class AuditoriaAuthListItemDto
{
    public int AuditoriaAuthId { get; set; }
    public DateTime FechaUtc { get; set; }
    public int? ActorUsuarioId { get; set; }
    public string? ActorEmail { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? DetalleJson { get; set; }
    public string? IpOrigen { get; set; }
}
