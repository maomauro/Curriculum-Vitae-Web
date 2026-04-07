using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class PersonalesConfiguration : IEntityTypeConfiguration<Personales>
{
    public void Configure(EntityTypeBuilder<Personales> builder)
    {
        builder.ToTable("Personales");

        builder.HasKey(p => p.PersonalesId);

        builder.Property(p => p.TipoIdentificacion).HasMaxLength(30);
        builder.Property(p => p.NumeroDocumento).HasMaxLength(20);
        builder.Property(p => p.LugarExpedicion).HasMaxLength(100);
        builder.Property(p => p.LibretaMilitarNumero).HasMaxLength(20);
        builder.Property(p => p.LibretaMilitarClase).HasMaxLength(10);
        builder.Property(p => p.PasaporteNumero).HasMaxLength(20);
        builder.Property(p => p.VisaNumero).HasMaxLength(30);
        builder.Property(p => p.VisaClase).HasMaxLength(30);
        builder.Property(p => p.PrimerNombre).IsRequired().HasMaxLength(50);
        builder.Property(p => p.SegundoNombre).HasMaxLength(50);
        builder.Property(p => p.PrimerApellido).IsRequired().HasMaxLength(50);
        builder.Property(p => p.SegundoApellido).HasMaxLength(50);
        builder.Property(p => p.LugarNacimiento).HasMaxLength(100);
        builder.Property(p => p.Genero).HasMaxLength(20);
        builder.Property(p => p.Nacionalidad).HasMaxLength(50);
        builder.Property(p => p.TipoSangre).HasMaxLength(5);
        builder.Property(p => p.EPS).HasMaxLength(100);
        builder.Property(p => p.Pencion).HasMaxLength(100);
        builder.Property(p => p.Cesantias).HasMaxLength(100);
        builder.Property(p => p.Email).HasMaxLength(150);
        builder.Property(p => p.Celular).HasMaxLength(15);
        builder.Property(p => p.TelefonoFijo).HasMaxLength(15);
        builder.Property(p => p.Pais).HasMaxLength(50);
        builder.Property(p => p.Departamento).HasMaxLength(50);
        builder.Property(p => p.Ciudad).HasMaxLength(50);
        builder.Property(p => p.Barrio).HasMaxLength(50);
        builder.Property(p => p.CodigoPostal).HasMaxLength(10);
        builder.Property(p => p.Direccion).HasMaxLength(200);
        builder.Property(p => p.TipoResidencia).HasMaxLength(30);
        builder.Property(p => p.FotoUrl).HasMaxLength(500);

        builder.Property(p => p.PrivacidadEmail)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("Publico");

        builder.Property(p => p.PrivacidadTelefono)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("Publico");

        builder.HasCheckConstraint(
            "CK_Personales_PrivacidadEmail",
            "PrivacidadEmail IN ('Publico', 'SoloFormulario', 'Oculto')");

        builder.HasCheckConstraint(
            "CK_Personales_PrivacidadTelefono",
            "PrivacidadTelefono IN ('Publico', 'Parcial', 'Oculto')");

        builder.HasOne(p => p.Curriculum)
            .WithOne(c => c.Personales)
            .HasForeignKey<Personales>(p => p.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
