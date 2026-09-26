using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class PromptIaConfiguration : IEntityTypeConfiguration<PromptIa>
{
    public void Configure(EntityTypeBuilder<PromptIa> builder)
    {
        builder.ToTable("PromptIa");

        builder.HasKey(x => x.PromptIaId);

        builder.Property(x => x.PromptIaId)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.Codigo)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Nombre)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.Descripcion)
            .HasMaxLength(500);

        builder.Property(x => x.RolContexto)
            .IsRequired();

        builder.Property(x => x.Tarea)
            .IsRequired();

        builder.Property(x => x.FormatoSalida)
            .IsRequired();

        builder.Property(x => x.Contenido)
            .IsRequired();

        builder.Property(x => x.Version)
            .IsRequired();

        builder.Property(x => x.EsActivo)
            .IsRequired();

        builder.Property(x => x.FechaCreacion)
            .IsRequired();

        builder.HasOne(x => x.Curriculum)
            .WithMany()
            .HasForeignKey(x => x.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.ActualizadoPor)
            .WithMany()
            .HasForeignKey(x => x.ActualizadoPorUsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(x => new { x.CurriculumId, x.Codigo })
            .IsUnique()
            .HasFilter("[EsActivo] = 1")
            .HasDatabaseName("UQ_PromptIa_Curriculum_Codigo_Activo");

        builder.HasIndex(x => new { x.CurriculumId, x.Codigo, x.Version })
            .IsUnique()
            .HasDatabaseName("UQ_PromptIa_Curriculum_Codigo_Version");

        builder.HasIndex(x => new { x.CurriculumId, x.Codigo })
            .HasDatabaseName("IX_PromptIa_Curriculum_Codigo");
    }
}
