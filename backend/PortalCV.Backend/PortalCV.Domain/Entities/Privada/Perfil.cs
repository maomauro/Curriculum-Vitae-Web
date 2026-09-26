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
    /// <summary>Mostrar la experiencia/aspiración salarial de ESTE perfil en el CV
    /// público -- interruptor por perfil (antes era un único interruptor global en
    /// Configuración que afectaba a todos los perfiles por igual).</summary>
    public bool MostrarExperienciaPerfil { get; set; } = true;
    public bool MostrarAspiracionSalarial { get; set; } = true;

    public Curriculum Curriculum { get; set; } = null!;
    public ICollection<Oferta> Ofertas { get; set; } = new List<Oferta>();
    public CvGenerado? CvGenerado { get; set; }
}
