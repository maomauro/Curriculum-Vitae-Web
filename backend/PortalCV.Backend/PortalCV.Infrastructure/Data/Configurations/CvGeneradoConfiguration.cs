using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class CvGeneradoConfiguration : IEntityTypeConfiguration<CvGenerado>
{
    public void Configure(EntityTypeBuilder<CvGenerado> builder)
    {
        builder.ToTable("CvGenerado");

        builder.HasKey(c => c.CvGeneradoId);

        builder.Property(c => c.ContenidoJson).IsRequired().HasColumnType("longtext");
        builder.Property(c => c.PromptPorDefecto).IsRequired().HasDefaultValue(false);
        builder.Property(c => c.FechaGeneracion).HasDefaultValueSql("UTC_TIMESTAMP()");

        builder.HasIndex(c => c.CurriculumId);
        // Uno por Perfil -- regenerar reemplaza el contenido en vez de crear una fila nueva.
        builder.HasIndex(c => c.PerfilId).IsUnique();

        builder.HasOne(c => c.Curriculum)
            .WithMany(cv => cv.CvsGenerados)
            .HasForeignKey(c => c.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);

        // NoAction (no Cascade): Curriculum->Perfil ya cascadea; si Perfil también
        // cascadeara hacia CvGenerado, SQL Server tendría dos rutas de cascada hacia
        // la misma fila. La cascada real ocurre por CurriculumId; borrar un Perfil con
        // CV asociado requiere borrar antes ese CvGenerado (ver CvEditorService.DeletePerfilAsync).
        builder.HasOne(c => c.Perfil)
            .WithOne(p => p.CvGenerado)
            .HasForeignKey<CvGenerado>(c => c.PerfilId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
