using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class EstadisticasPublicasConfiguration : IEntityTypeConfiguration<EstadisticasPublicas>
{
    public void Configure(EntityTypeBuilder<EstadisticasPublicas> builder)
    {
        builder.ToTable("EstadisticasPublicas");

        builder.HasKey(e => e.EstadisticasId);

        builder.Property(e => e.TotalVisitas).HasDefaultValue(0);
        builder.Property(e => e.TotalContactos).HasDefaultValue(0);
        builder.Property(e => e.FechaActualizacion).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(e => e.Curriculum)
            .WithOne(c => c.EstadisticasPublicas)
            .HasForeignKey<EstadisticasPublicas>(e => e.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
