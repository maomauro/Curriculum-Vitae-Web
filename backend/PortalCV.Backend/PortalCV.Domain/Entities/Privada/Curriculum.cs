namespace PortalCV.Domain.Entities;

public class Curriculum
{
    public int CurriculumId { get; set; }
    public int UsuarioId { get; set; }
    public string UrlPublica { get; set; } = string.Empty;
    public string Estado { get; set; } = "Borrador";
    public int ContadorVisitas { get; set; }
    public int ContadorContactos { get; set; }
    /// <summary>Código de plantilla de presentación (Mi CV / PDF). Valores: clasico, profesional, ats, corporativo, ejecutivo.</summary>
    public string PlantillaCodigo { get; set; } = "clasico";
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;

    // Navegación — secciones del CV
    public Personales? Personales { get; set; }
    public ICollection<Perfil> Perfiles { get; set; } = new List<Perfil>();
    public ICollection<Experiencia> Experiencias { get; set; } = new List<Experiencia>();
    public ICollection<Formacion> Formaciones { get; set; } = new List<Formacion>();
    public ICollection<Habilidad> Habilidades { get; set; } = new List<Habilidad>();
    public ICollection<Proyecto> Proyectos { get; set; } = new List<Proyecto>();
    public ICollection<Referencia> Referencias { get; set; } = new List<Referencia>();
    public ICollection<FamiliarContacto> FamiliarsContacto { get; set; } = new List<FamiliarContacto>();
    public ICollection<RedSocial> RedesSociales { get; set; } = new List<RedSocial>();
    public ICollection<VisitanteContacto> VisitantesContacto { get; set; } = new List<VisitanteContacto>();
    public ICollection<AlertaVisita> AlertasVisita { get; set; } = new List<AlertaVisita>();
    public ICollection<VisibilidadSeccion> VisibilidadesSeccion { get; set; } = new List<VisibilidadSeccion>();
    public EstadisticasPublicas? EstadisticasPublicas { get; set; }
}
