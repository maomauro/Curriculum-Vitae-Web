namespace PortalCV.Application.DTOs.Privada;

public class AuditoriaCvListItemDto
{
    public int AuditoriaCvId { get; set; }
    public DateTime FechaUtc { get; set; }
    public int? ActorUsuarioId { get; set; }
    public string? ActorEmail { get; set; }
    public int CurriculumId { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string EntidadTipo { get; set; } = string.Empty;
    public int? EntidadId { get; set; }
    public string? DetalleJson { get; set; }
    /// <summary>Solo en listado admin: dueño del curriculum.</summary>
    public string? PropietarioEmail { get; set; }
    /// <summary>Solo en listado admin: slug público del CV.</summary>
    public string? UrlPublica { get; set; }
}

public class AuditoriaCvPageDto
{
    public IReadOnlyList<AuditoriaCvListItemDto> Items { get; set; } = Array.Empty<AuditoriaCvListItemDto>();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
