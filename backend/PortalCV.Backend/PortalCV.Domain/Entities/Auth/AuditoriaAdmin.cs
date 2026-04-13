namespace PortalCV.Domain.Entities;

/// <summary>Registro append-only de acciones del panel de administración.</summary>
public class AuditoriaAdmin
{
    public int AuditoriaAdminId { get; set; }
    public DateTime FechaUtc { get; set; }
    public int? ActorUsuarioId { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string EntidadTipo { get; set; } = string.Empty;
    public int? EntidadId { get; set; }
    public string? DetalleJson { get; set; }

    public Usuario? Actor { get; set; }
}
