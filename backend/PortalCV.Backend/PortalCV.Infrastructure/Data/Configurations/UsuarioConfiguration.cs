using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuario");

        builder.HasKey(x => x.UsuarioId);

        builder.Property(x => x.UsuarioId)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.Email)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.PasswordHash)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.Estado)
            .HasMaxLength(20)
            .IsRequired()
            .HasDefaultValue("Activo");

        builder.Property(x => x.FechaRegistro)
            .IsRequired();
    }
}
