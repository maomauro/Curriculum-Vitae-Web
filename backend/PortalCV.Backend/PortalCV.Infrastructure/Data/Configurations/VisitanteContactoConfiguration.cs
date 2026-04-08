using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class VisitanteContactoConfiguration : IEntityTypeConfiguration<VisitanteContacto>
{
    public void Configure(EntityTypeBuilder<VisitanteContacto> builder)
    {
        builder.ToTable("VisitanteContacto");

        builder.HasKey(v => v.VisitanteContactoId);

        builder.Property(v => v.Nombre).HasMaxLength(100);
        builder.Property(v => v.Correo).IsRequired().HasMaxLength(150);
        builder.Property(v => v.Empresa).HasMaxLength(150);
        builder.Property(v => v.MotivoContacto).HasMaxLength(100);
        builder.Property(v => v.Asunto).HasMaxLength(200);
        builder.Property(v => v.ComoMeEncontraste).HasMaxLength(100);
        builder.Property(v => v.Mensaje).HasColumnType("nvarchar(max)");
        builder.Property(v => v.FechaContacto).HasDefaultValueSql("GETDATE()");
        builder.Property(v => v.EsLeido).HasDefaultValue(false);

        builder.HasOne(v => v.Curriculum)
            .WithMany(c => c.VisitantesContacto)
            .HasForeignKey(v => v.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
