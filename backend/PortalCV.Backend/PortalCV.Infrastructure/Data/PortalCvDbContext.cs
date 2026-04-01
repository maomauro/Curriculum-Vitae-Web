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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UsuarioConfiguration());
        modelBuilder.ApplyConfiguration(new RolConfiguration());
        modelBuilder.ApplyConfiguration(new UsuarioRolConfiguration());
        modelBuilder.ApplyConfiguration(new CurriculumConfiguration());

        base.OnModelCreating(modelBuilder);
    }
}
