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
            .HasDatabaseName("UQ_ProveedorIa_Curriculum_Activo");

        builder.HasOne(p => p.Curriculum)
            .WithMany(c => c.ProveedoresIa)
            .HasForeignKey(p => p.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
