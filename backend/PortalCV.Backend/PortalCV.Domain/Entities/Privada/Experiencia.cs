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
    /// <summary>Incluir este empleo en Mi CV y en el detalle público (cuando la sección Experiencia esté visible).</summary>
    public bool MostrarEnCv { get; set; } = true;
    /// <summary>URL pegada por el usuario (legacy). Si <see cref="AdjuntoSoporteBytes"/> tiene
    /// valor, se ignora en favor del adjunto subido como binario.</summary>
    public string? AdjuntoSoporte { get; set; }
    public byte[]? AdjuntoSoporteBytes { get; set; }
    public string? AdjuntoSoporteContentType { get; set; }
    public DateTime FechaRegistro { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
    public ICollection<Referencia> Referencias { get; set; } = new List<Referencia>();
}
