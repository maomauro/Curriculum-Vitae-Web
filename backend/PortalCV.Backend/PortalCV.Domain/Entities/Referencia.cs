namespace PortalCV.Domain.Entities;

public class Referencia
{
    public int ReferenciaId { get; set; }
    public int CurriculumId { get; set; }
    public string TipoReferencia { get; set; } = string.Empty;
    public int? ExperienciaId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Apellido { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Parentesco { get; set; }

    // Solo si TipoReferencia = 'Laboral'
    public string? Cargo { get; set; }
    public string? Empresa { get; set; }
    public string? Relacion { get; set; }
    public string? Observaciones { get; set; }
    public string? AdjuntoSoporte { get; set; }

    public DateTime FechaRegistro { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
    public Experiencia? Experiencia { get; set; }
}
