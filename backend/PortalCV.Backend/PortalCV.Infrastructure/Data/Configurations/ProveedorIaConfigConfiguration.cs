using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class ProveedorIaConfigConfiguration : IEntityTypeConfiguration<ProveedorIaConfig>
{
    public void Configure(EntityTypeBuilder<ProveedorIaConfig> builder)
    {
        builder.ToTable("ProveedorIaConfig", t =>
            t.HasCheckConstraint("CK_ProveedorIaConfig_Proveedor", "Proveedor IN ('claude', 'openai', 'gemini', 'ollama', 'otro')"));

        builder.HasKey(p => p.ProveedorIaConfigId);

        builder.Property(p => p.Proveedor).IsRequired().HasMaxLength(20);
        builder.Property(p => p.Nombre).HasMaxLength(100);
        builder.Property(p => p.Modelo).HasMaxLength(100);
        builder.Property(p => p.Endpoint).HasMaxLength(500);
        builder.Property(p => p.ApiKeyCifrada).HasColumnType("nvarchar(max)");
        builder.Property(p => p.EsActivo).HasDefaultValue(false);
        builder.Property(p => p.FechaCreacion).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(p => p.FechaActualizacion).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(p => p.CurriculumId);

        // Solo una conexión activa por CV a la vez — mismo patrón que
        // UQ_PromptIa_Curriculum_Codigo_Activo (índice único filtrado).
        builder.HasIndex(p => p.CurriculumId)
            .IsUnique()
            .HasFilter("[EsActivo] = 1")
            .HasDatabaseName("UQ_ProveedorIaConfig_Curriculum_Activo");

        builder.HasOne(p => p.Curriculum)
            .WithMany(c => c.ProveedoresIaConfig)
            .HasForeignKey(p => p.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
