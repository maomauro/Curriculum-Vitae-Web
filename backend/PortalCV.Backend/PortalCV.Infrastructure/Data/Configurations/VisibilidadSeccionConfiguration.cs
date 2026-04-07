using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class VisibilidadSeccionConfiguration : IEntityTypeConfiguration<VisibilidadSeccion>
{
    public void Configure(EntityTypeBuilder<VisibilidadSeccion> builder)
    {
        builder.ToTable("VisibilidadSeccion");

        builder.HasKey(v => v.VisibilidadSeccionId);

        builder.Property(v => v.NombreSeccion).IsRequired().HasMaxLength(50);
        builder.Property(v => v.EsVisible).HasDefaultValue(true);

        builder.HasIndex(v => new { v.CurriculumId, v.NombreSeccion })
            .IsUnique();

        builder.HasOne(v => v.Curriculum)
            .WithMany(c => c.VisibilidadesSeccion)
            .HasForeignKey(v => v.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
