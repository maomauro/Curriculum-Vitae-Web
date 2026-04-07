namespace PortalCV.Domain.Entities;

public class RedSocial
{
    public int RedSocialId { get; set; }
    public int CurriculumId { get; set; }
    public string NombreRed { get; set; } = string.Empty;
    public string? LinkPublico { get; set; }
    public string? UsuarioContacto { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
}
