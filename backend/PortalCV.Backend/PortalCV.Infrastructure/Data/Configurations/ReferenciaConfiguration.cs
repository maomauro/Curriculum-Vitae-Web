using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class ReferenciaConfiguration : IEntityTypeConfiguration<Referencia>
{
    public void Configure(EntityTypeBuilder<Referencia> builder)
    {
        builder.ToTable("Referencia", t =>
            t.HasCheckConstraint("CK_Referencia_TipoReferencia", "TipoReferencia IN ('Laboral', 'Personal')"));

        builder.HasKey(r => r.ReferenciaId);

        builder.Property(r => r.TipoReferencia).IsRequired().HasMaxLength(20);
        builder.Property(r => r.Nombre).IsRequired().HasMaxLength(100);
        builder.Property(r => r.Apellido).HasMaxLength(100);
        builder.Property(r => r.Email).HasMaxLength(150);
        builder.Property(r => r.Telefono).HasMaxLength(15);
        builder.Property(r => r.Parentesco).HasMaxLength(50);
        builder.Property(r => r.Cargo).HasMaxLength(100);
        builder.Property(r => r.Empresa).HasMaxLength(150);
        builder.Property(r => r.Relacion).HasMaxLength(80);
        builder.Property(r => r.Observaciones).HasColumnType("nvarchar(max)");
        builder.Property(r => r.AdjuntoSoporte).HasMaxLength(500);
        builder.Property(r => r.FechaRegistro).HasDefaultValueSql("GETDATE()");

        builder.HasOne(r => r.Curriculum)
            .WithMany(c => c.Referencias)
            .HasForeignKey(r => r.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Experiencia)
            .WithMany(e => e.Referencias)
            .HasForeignKey(r => r.ExperienciaId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
