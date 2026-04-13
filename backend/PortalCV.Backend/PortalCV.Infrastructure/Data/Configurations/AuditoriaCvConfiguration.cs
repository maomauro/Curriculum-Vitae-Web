using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class AuditoriaCvConfiguration : IEntityTypeConfiguration<AuditoriaCv>
{
    public void Configure(EntityTypeBuilder<AuditoriaCv> builder)
    {
        builder.ToTable("AuditoriaCv");

        builder.HasKey(x => x.AuditoriaCvId);

        builder.Property(x => x.AuditoriaCvId)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.FechaUtc)
            .IsRequired();

        builder.Property(x => x.Accion)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(x => x.EntidadTipo)
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(x => x.DetalleJson);

        // NO ACTION: evita "multiple cascade paths" en SQL Server (Usuario → Curriculum CASCADE → AuditoriaCv
        // y a la vez Usuario → Actor en la misma tabla).
        builder.HasOne(x => x.Actor)
            .WithMany()
            .HasForeignKey(x => x.ActorUsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(x => x.Curriculum)
            .WithMany()
            .HasForeignKey(x => x.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.CurriculumId);
    }
}
