namespace PortalCV.Domain.Entities;

public class Habilidad
{
    public int HabilidadId { get; set; }
    public int CurriculumId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Tipo { get; set; }
    public string? Nivel { get; set; }
    public string? Descripcion { get; set; }

    // Niveles CEFR — solo aplica cuando Tipo = 'Idioma'
    public string? NivelLectura { get; set; }
    public string? NivelEscritura { get; set; }
    public string? NivelEscucha { get; set; }
    public string? NivelHabla { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
}
