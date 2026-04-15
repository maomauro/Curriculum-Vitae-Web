using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Application;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class CurriculumConfiguration : IEntityTypeConfiguration<Curriculum>
{
    public void Configure(EntityTypeBuilder<Curriculum> builder)
    {
        builder.ToTable("Curriculum");

        builder.HasKey(x => x.CurriculumId);

        builder.Property(x => x.CurriculumId)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.UrlPublica)
            .HasMaxLength(255)
            .IsRequired();

        builder.HasIndex(x => x.UrlPublica)
            .IsUnique();

        builder.Property(x => x.Estado)
            .HasMaxLength(20)
            .IsRequired()
            .HasDefaultValue(CurriculumEstados.Borrador);

        builder.Property(x => x.ContadorVisitas)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(x => x.ContadorContactos)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(x => x.PlantillaCodigo)
            .HasMaxLength(32)
            .IsRequired()
            .HasDefaultValue("clasico");

        builder.Property(x => x.FechaCreacion)
            .IsRequired();

        builder.Property(x => x.FechaActualizacion)
            .IsRequired();

        builder.HasOne(x => x.Usuario)
            .WithMany(x => x.Curriculums)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
