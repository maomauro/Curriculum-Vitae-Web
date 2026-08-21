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
    /// <summary>URL pegada por el usuario (legacy). Si <see cref="AdjuntoSoporteBytes"/> tiene
    /// valor, se ignora en favor del adjunto subido como binario.</summary>
    public string? AdjuntoSoporte { get; set; }
    public byte[]? AdjuntoSoporteBytes { get; set; }
    public string? AdjuntoSoporteContentType { get; set; }
    public DateOnly? FechaVigencia { get; set; }
    public int? DuracionHoras { get; set; }
    public bool MostrarEnCv { get; set; } = true;

    public Curriculum Curriculum { get; set; } = null!;
}
