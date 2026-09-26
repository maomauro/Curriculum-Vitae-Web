using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class ConfiguracionCorreoConfiguration : IEntityTypeConfiguration<ConfiguracionCorreo>
{
    public void Configure(EntityTypeBuilder<ConfiguracionCorreo> builder)
    {
        builder.ToTable("ConfiguracionCorreo");

        builder.HasKey(c => c.ConfiguracionCorreoId);

        builder.Property(c => c.Host).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Puerto).IsRequired();
        builder.Property(c => c.UsarTls).HasDefaultValue(true);
        builder.Property(c => c.PasswordCifrada).HasColumnType("longtext");
        builder.Property(c => c.FechaCreacion).HasDefaultValueSql("UTC_TIMESTAMP()");
        builder.Property(c => c.FechaActualizacion).HasDefaultValueSql("UTC_TIMESTAMP()");

        // Una configuración de correo por CV -- a diferencia de ProveedorIa (varias
        // conexiones posibles), acá no hay concepto de "activo/inactivo".
        builder.HasIndex(c => c.CurriculumId).IsUnique();

        builder.HasOne(c => c.Curriculum)
            .WithOne(cv => cv.ConfiguracionCorreo)
            .HasForeignKey<ConfiguracionCorreo>(c => c.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
