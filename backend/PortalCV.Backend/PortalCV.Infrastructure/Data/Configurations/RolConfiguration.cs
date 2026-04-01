using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class RolConfiguration : IEntityTypeConfiguration<Rol>
{
    public void Configure(EntityTypeBuilder<Rol> builder)
    {
        builder.ToTable("Rol");

        builder.HasKey(x => x.RolId);

        builder.Property(x => x.RolId)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.NombreRol)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Descripcion)
            .HasMaxLength(255);
    }
}
