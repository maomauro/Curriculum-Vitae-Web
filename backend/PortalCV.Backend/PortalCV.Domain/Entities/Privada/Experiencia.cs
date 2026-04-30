namespace PortalCV.Domain.Entities;

public class Experiencia
{
    public int ExperienciaId { get; set; }
    public int CurriculumId { get; set; }
    public string? Empresa { get; set; }
    public string? Cargo { get; set; }
    public string? Sector { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public string? TipoContrato { get; set; }
    public string? MotivoRetiro { get; set; }
    public string? Funciones { get; set; }
    public bool EsActual { get; set; } = false;
    /** Incluir este empleo en Mi CV y en el detalle público (cuando la sección Experiencia esté visible). */
    public bool MostrarEnCv { get; set; } = true;
    public string? AdjuntoSoporte { get; set; }
    public DateTime FechaRegistro { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
    public ICollection<Referencia> Referencias { get; set; } = new List<Referencia>();
}
