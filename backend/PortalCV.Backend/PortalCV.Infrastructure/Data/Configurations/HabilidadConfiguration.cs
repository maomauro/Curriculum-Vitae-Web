using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class HabilidadConfiguration : IEntityTypeConfiguration<Habilidad>
{
    public void Configure(EntityTypeBuilder<Habilidad> builder)
    {
        builder.ToTable("Habilidad", t =>
            t.HasCheckConstraint("CK_Habilidad_Tipo", "Tipo IN ('Tecnica', 'Blanda', 'Idioma', 'Otra')"));

        builder.HasKey(h => h.HabilidadId);

        builder.Property(h => h.Nombre).IsRequired().HasMaxLength(100);
        builder.Property(h => h.Tipo).HasMaxLength(20);
        builder.Property(h => h.Nivel).HasMaxLength(20);
        builder.Property(h => h.Descripcion).HasMaxLength(300);

        // Niveles CEFR para idiomas
        builder.Property(h => h.NivelLectura).HasMaxLength(5);
        builder.Property(h => h.NivelEscritura).HasMaxLength(5);
        builder.Property(h => h.NivelEscucha).HasMaxLength(5);
        builder.Property(h => h.NivelHabla).HasMaxLength(5);

        builder.HasOne(h => h.Curriculum)
            .WithMany(c => c.Habilidades)
            .HasForeignKey(h => h.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
