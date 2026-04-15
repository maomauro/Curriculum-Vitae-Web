using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class AuditoriaAdminConfiguration : IEntityTypeConfiguration<AuditoriaAdmin>
{
    public void Configure(EntityTypeBuilder<AuditoriaAdmin> builder)
    {
        builder.ToTable("AuditoriaAdmin");

        builder.HasKey(x => x.AuditoriaAdminId);

        builder.Property(x => x.AuditoriaAdminId)
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

        builder.HasOne(x => x.Actor)
            .WithMany()
            .HasForeignKey(x => x.ActorUsuarioId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.FechaUtc)
            .IsDescending();
    }
}
