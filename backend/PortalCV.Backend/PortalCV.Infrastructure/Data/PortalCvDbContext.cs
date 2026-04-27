using Microsoft.EntityFrameworkCore;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data.Configurations;

namespace PortalCV.Infrastructure.Data;

public class PortalCvDbContext : DbContext
{
    public PortalCvDbContext(DbContextOptions<PortalCvDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<UsuarioRol> UsuarioRoles => Set<UsuarioRol>();
    public DbSet<Curriculum> Curriculums => Set<Curriculum>();
    public DbSet<Personales> Personales => Set<Personales>();
    public DbSet<Perfil> Perfiles => Set<Perfil>();
    public DbSet<Experiencia> Experiencias => Set<Experiencia>();
    public DbSet<Formacion> Formaciones => Set<Formacion>();
    public DbSet<Habilidad> Habilidades => Set<Habilidad>();
    public DbSet<Proyecto> Proyectos => Set<Proyecto>();
    public DbSet<Referencia> Referencias => Set<Referencia>();
    public DbSet<FamiliarContacto> FamiliarsContacto => Set<FamiliarContacto>();
    public DbSet<RedSocial> RedesSociales => Set<RedSocial>();
    public DbSet<VisitanteContacto> VisitantesContacto => Set<VisitanteContacto>();
    public DbSet<AlertaVisita> AlertasVisita => Set<AlertaVisita>();
    public DbSet<VisibilidadSeccion> VisibilidadesSeccion => Set<VisibilidadSeccion>();
    public DbSet<EstadisticasPublicas> EstadisticasPublicas => Set<EstadisticasPublicas>();
    public DbSet<AuditoriaAdmin> AuditoriasAdmin => Set<AuditoriaAdmin>();
    public DbSet<AuditoriaCv> AuditoriasCv => Set<AuditoriaCv>();
    public DbSet<PublicCvSnapshotExport> PublicCvSnapshotExports => Set<PublicCvSnapshotExport>();
    public DbSet<PublicStaticSnapshotState> PublicStaticSnapshotState => Set<PublicStaticSnapshotState>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UsuarioConfiguration());
        modelBuilder.ApplyConfiguration(new RolConfiguration());
        modelBuilder.ApplyConfiguration(new UsuarioRolConfiguration());
        modelBuilder.ApplyConfiguration(new CurriculumConfiguration());
        modelBuilder.ApplyConfiguration(new PersonalesConfiguration());
        modelBuilder.ApplyConfiguration(new PerfilConfiguration());
        modelBuilder.ApplyConfiguration(new ExperienciaConfiguration());
        modelBuilder.ApplyConfiguration(new FormacionConfiguration());
        modelBuilder.ApplyConfiguration(new HabilidadConfiguration());
        modelBuilder.ApplyConfiguration(new ProyectoConfiguration());
        modelBuilder.ApplyConfiguration(new ReferenciaConfiguration());
        modelBuilder.ApplyConfiguration(new FamiliarContactoConfiguration());
        modelBuilder.ApplyConfiguration(new RedSocialConfiguration());
        modelBuilder.ApplyConfiguration(new VisitanteContactoConfiguration());
        modelBuilder.ApplyConfiguration(new AlertaVisitaConfiguration());
        modelBuilder.ApplyConfiguration(new VisibilidadSeccionConfiguration());
        modelBuilder.ApplyConfiguration(new EstadisticasPublicasConfiguration());
        modelBuilder.ApplyConfiguration(new AuditoriaAdminConfiguration());
        modelBuilder.ApplyConfiguration(new AuditoriaCvConfiguration());
        modelBuilder.ApplyConfiguration(new PublicCvSnapshotExportConfiguration());
        modelBuilder.ApplyConfiguration(new PublicStaticSnapshotStateConfiguration());

        base.OnModelCreating(modelBuilder);
    }
}
