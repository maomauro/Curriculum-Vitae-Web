using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class OfertaConfiguration : IEntityTypeConfiguration<Oferta>
{
    public void Configure(EntityTypeBuilder<Oferta> builder)
    {
        builder.ToTable("Oferta", t =>
        {
            t.HasCheckConstraint("CK_Oferta_OrigenEntrada", "OrigenEntrada IN ('texto', 'imagen', 'ambos')");
            t.HasCheckConstraint("CK_Oferta_Estado", "Estado IN ('Analizada', 'PerfilAsignado', 'EnviadaPorCorreo')");
        });

        builder.HasKey(o => o.OfertaId);

        builder.Property(o => o.Cargo).IsRequired().HasMaxLength(150);
        builder.Property(o => o.Empresa).IsRequired().HasMaxLength(150);
        builder.Property(o => o.Descripcion).HasColumnType("nvarchar(max)");
        builder.Property(o => o.CorreoReclutador).HasMaxLength(150);
        builder.Property(o => o.NombreReclutador).HasMaxLength(150);
        builder.Property(o => o.Modalidad).HasMaxLength(150);
        builder.Property(o => o.TipoContrato).HasMaxLength(100);
        builder.Property(o => o.Moneda).HasMaxLength(20);
        builder.Property(o => o.Duracion).HasMaxLength(150);
        builder.Property(o => o.Horario).HasMaxLength(100);
        builder.Property(o => o.ExperienciaRequerida).HasMaxLength(100);
        builder.Property(o => o.StackTecnologico).HasColumnType("nvarchar(max)");
        builder.Property(o => o.NivelIdioma).HasMaxLength(100);
        builder.Property(o => o.TextoOriginal).IsRequired().HasColumnType("nvarchar(max)");
        builder.Property(o => o.OrigenEntrada).IsRequired().HasMaxLength(20);
        builder.Property(o => o.Estado).IsRequired().HasMaxLength(20);
        builder.Property(o => o.FechaAnalisis).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(o => o.CurriculumId);

        builder.HasOne(o => o.Curriculum)
            .WithMany(c => c.Ofertas)
            .HasForeignKey(o => o.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(o => o.Perfil)
            .WithMany(p => p.Ofertas)
            .HasForeignKey(o => o.PerfilId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
