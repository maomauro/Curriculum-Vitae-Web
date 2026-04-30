using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class FormacionConfiguration : IEntityTypeConfiguration<Formacion>
{
    public void Configure(EntityTypeBuilder<Formacion> builder)
    {
        builder.ToTable("Formacion");

        builder.HasKey(f => f.FormacionId);

        builder.Property(f => f.Titulo).HasMaxLength(200);
        builder.Property(f => f.Institucion).HasMaxLength(200);
        builder.Property(f => f.Area).HasMaxLength(300);
        builder.Property(f => f.TipoFormacion).HasMaxLength(50);
        builder.Property(f => f.Descripcion).HasColumnType("nvarchar(max)");
        builder.Property(f => f.AdjuntoSoporte).HasMaxLength(500);
        builder.Property(f => f.MostrarEnCv).HasDefaultValue(true);

        builder.HasOne(f => f.Curriculum)
            .WithMany(c => c.Formaciones)
            .HasForeignKey(f => f.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
