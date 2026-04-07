namespace PortalCV.Domain.Entities;

public class FamiliarContacto
{
    public int FamiliarId { get; set; }
    public int CurriculumId { get; set; }
    public string? Parentesco { get; set; }
    public string? Nombres { get; set; }
    public string? Apellidos { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public bool EsContactoPrincipal { get; set; } = false;

    public Curriculum Curriculum { get; set; } = null!;
}
