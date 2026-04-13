using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class AlertaVisitaConfiguration : IEntityTypeConfiguration<AlertaVisita>
{
    public void Configure(EntityTypeBuilder<AlertaVisita> builder)
    {
        builder.ToTable("AlertaVisita", t =>
            t.HasCheckConstraint("CK_AlertaVisita_TipoVisita", "TipoVisita IN ('Vista', 'Contacto', 'Descarga', 'Sistema')"));

        builder.HasKey(a => a.AlertaVisitaId);

        builder.Property(a => a.FechaVisita).HasDefaultValueSql("GETDATE()");
        builder.Property(a => a.Origen).HasMaxLength(100);
        builder.Property(a => a.TipoVisita).HasMaxLength(20);
        builder.Property(a => a.EsLeida).HasDefaultValue(false);
        builder.Property(a => a.Titulo).HasMaxLength(200);
        builder.Property(a => a.Descripcion).HasMaxLength(500);
        builder.Property(a => a.Ciudad).HasMaxLength(80);
        builder.Property(a => a.Pais).HasMaxLength(50);

        builder.HasOne(a => a.Curriculum)
            .WithMany(c => c.AlertasVisita)
            .HasForeignKey(a => a.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
