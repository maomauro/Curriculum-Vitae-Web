namespace PortalCV.Domain.Entities;

public class Perfil
{
    public int PerfilId { get; set; }
    public int CurriculumId { get; set; }
    public string? NombrePerfil { get; set; }
    public string? DescripcionPerfil { get; set; }
    public decimal? ExperienciaPerfilAnios { get; set; }
    public decimal? AspiracionSalarialPesos { get; set; }
    public decimal? AspiracionSalarialDolares { get; set; }
    public bool EsActivo { get; set; } = true;

    public Curriculum Curriculum { get; set; } = null!;
}
