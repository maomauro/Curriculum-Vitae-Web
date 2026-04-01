namespace PortalCV.Domain.Entities;

public class Curriculum
{
    public int CurriculumId { get; set; }
    public int UsuarioId { get; set; }
    public string UrlPublica { get; set; } = string.Empty;
    public string Estado { get; set; } = "Borrador";
    public int ContadorVisitas { get; set; }
    public int ContadorContactos { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;
}
