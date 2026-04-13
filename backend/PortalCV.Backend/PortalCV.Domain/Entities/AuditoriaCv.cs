namespace PortalCV.Domain.Entities;

/// <summary>Registro append-only de cambios realizados sobre el CV desde el área privada (publicador/admin con token de curriculum).</summary>
public class AuditoriaCv
{
    public int AuditoriaCvId { get; set; }
    public DateTime FechaUtc { get; set; }
    public int? ActorUsuarioId { get; set; }
    public int CurriculumId { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string EntidadTipo { get; set; } = string.Empty;
    public int? EntidadId { get; set; }
    public string? DetalleJson { get; set; }

    public Usuario? Actor { get; set; }
    public Curriculum? Curriculum { get; set; }
}
