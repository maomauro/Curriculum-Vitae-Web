namespace PortalCV.Domain.Entities;

public class VisitanteContacto
{
    public int VisitanteContactoId { get; set; }
    public int CurriculumId { get; set; }
    public string? Nombre { get; set; }
    public string Correo { get; set; } = string.Empty;
    public string? Empresa { get; set; }
    public string? MotivoContacto { get; set; }
    public string? Asunto { get; set; }
    public string? ComoMeEncontraste { get; set; }
    public string? Mensaje { get; set; }
    public DateTime FechaContacto { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
}
