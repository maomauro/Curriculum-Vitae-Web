using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class ExperienciaConfiguration : IEntityTypeConfiguration<Experiencia>
{
    public void Configure(EntityTypeBuilder<Experiencia> builder)
    {
        builder.ToTable("Experiencia");

        builder.HasKey(e => e.ExperienciaId);

        builder.Property(e => e.Empresa).HasMaxLength(150);
        builder.Property(e => e.Cargo).HasMaxLength(100);
        builder.Property(e => e.Sector).HasMaxLength(80);
        builder.Property(e => e.TipoContrato).HasMaxLength(50);
        builder.Property(e => e.MotivoRetiro).HasMaxLength(200);
        builder.Property(e => e.Funciones).HasColumnType("nvarchar(max)");
        builder.Property(e => e.AdjuntoSoporte).HasMaxLength(500);
        builder.Property(e => e.EsActual).HasDefaultValue(false);
        builder.Property(e => e.FechaRegistro).HasDefaultValueSql("GETDATE()");

        builder.HasOne(e => e.Curriculum)
            .WithMany(c => c.Experiencias)
            .HasForeignKey(e => e.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.Referencias)
            .WithOne(r => r.Experiencia)
            .HasForeignKey(r => r.ExperienciaId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
