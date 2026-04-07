using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class ProyectoConfiguration : IEntityTypeConfiguration<Proyecto>
{
    public void Configure(EntityTypeBuilder<Proyecto> builder)
    {
        builder.ToTable("Proyecto");

        builder.HasKey(p => p.ProyectoId);

        builder.Property(p => p.NombreProyecto).HasMaxLength(150);
        builder.Property(p => p.Rol).HasMaxLength(80);
        builder.Property(p => p.StackTecnologico).HasMaxLength(500);
        builder.Property(p => p.Aporte).HasColumnType("nvarchar(max)");
        builder.Property(p => p.Logro).HasColumnType("nvarchar(max)");
        builder.Property(p => p.Desafio).HasColumnType("nvarchar(max)");

        builder.HasOne(p => p.Curriculum)
            .WithMany(c => c.Proyectos)
            .HasForeignKey(p => p.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
