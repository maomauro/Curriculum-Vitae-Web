namespace PortalCV.Domain.Entities;

public class VisibilidadSeccion
{
    public int VisibilidadSeccionId { get; set; }
    public int CurriculumId { get; set; }
    public string NombreSeccion { get; set; } = string.Empty;
    public bool EsVisible { get; set; } = true;

    public Curriculum Curriculum { get; set; } = null!;
}
