namespace PortalCV.Domain.Entities;

public class Formacion
{
    public int FormacionId { get; set; }
    public int CurriculumId { get; set; }
    public string? Titulo { get; set; }
    public string? Institucion { get; set; }
    public string? Area { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public string? TipoFormacion { get; set; }
    public string? Descripcion { get; set; }
    public string? AdjuntoSoporte { get; set; }
    public DateOnly? FechaVigencia { get; set; }
    public int? DuracionHoras { get; set; }
    public bool MostrarEnCv { get; set; } = true;

    public Curriculum Curriculum { get; set; } = null!;
}
