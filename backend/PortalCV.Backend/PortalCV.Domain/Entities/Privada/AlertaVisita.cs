namespace PortalCV.Domain.Entities;

public class AlertaVisita
{
    public int AlertaVisitaId { get; set; }
    public int CurriculumId { get; set; }
    public DateTime FechaVisita { get; set; }
    public string? Origen { get; set; }
    public string? TipoVisita { get; set; } // 'Vista' | 'Contacto' | 'Descarga' | 'Sistema'
    public bool EsLeida { get; set; } = false;
    public string? Titulo { get; set; }
    public string? Descripcion { get; set; }
    public string? Ciudad { get; set; }
    public string? Pais { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
}
