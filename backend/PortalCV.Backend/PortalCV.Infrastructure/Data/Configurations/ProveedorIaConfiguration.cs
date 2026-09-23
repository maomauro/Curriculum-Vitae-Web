using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class ProveedorIaConfiguration : IEntityTypeConfiguration<ProveedorIa>
{
    public void Configure(EntityTypeBuilder<ProveedorIa> builder)
    {
        builder.ToTable("ProveedorIa", t =>
            t.HasCheckConstraint("CK_ProveedorIa_Proveedor", "Proveedor IN ('claude', 'openai', 'gemini', 'groq', 'ollama', 'otro')"));

        builder.HasKey(p => p.ProveedorIaId);

        builder.Property(p => p.Proveedor).IsRequired().HasMaxLength(20);
        builder.Property(p => p.Nombre).HasMaxLength(100);
        builder.Property(p => p.Modelo).HasMaxLength(100);
        builder.Property(p => p.Endpoint).HasMaxLength(500);
        builder.Property(p => p.ApiKeyCifrada).HasColumnType("longtext");
        builder.Property(p => p.EsActivo).HasDefaultValue(false);
        builder.Property(p => p.FechaCreacion).HasDefaultValueSql("UTC_TIMESTAMP()");
        builder.Property(p => p.FechaActualizacion).HasDefaultValueSql("UTC_TIMESTAMP()");

        // Solo una conexión activa a la vez en TODA la plataforma (configuración
        // global administrada por Admin, ya no por CV) — índice único filtrado.
        builder.HasIndex(p => p.EsActivo)
            .IsUnique()
            .HasFilter("[EsActivo] = 1")
            .HasDatabaseName("UQ_ProveedorIa_Activo");
    }
}
