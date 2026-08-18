using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class AuditoriaAuthConfiguration : IEntityTypeConfiguration<AuditoriaAuth>
{
    public void Configure(EntityTypeBuilder<AuditoriaAuth> builder)
    {
        builder.ToTable("AuditoriaAuth");

        builder.HasKey(x => x.AuditoriaAuthId);

        builder.Property(x => x.AuditoriaAuthId)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.FechaUtc)
            .IsRequired();

        builder.Property(x => x.Accion)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(x => x.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(x => x.DetalleJson);

        builder.Property(x => x.IpOrigen)
            .HasMaxLength(45);

        builder.HasOne(x => x.Actor)
            .WithMany()
            .HasForeignKey(x => x.ActorUsuarioId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.FechaUtc)
            .IsDescending();
    }
}
