namespace PortalCV.Domain.Entities;

public class EstadisticasPublicas
{
    public int EstadisticasId { get; set; }
    public int CurriculumId { get; set; }
    public int TotalVisitas { get; set; }
    public int TotalContactos { get; set; }
    public DateTime? UltimaVisita { get; set; }
    public DateTime FechaActualizacion { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
}
