using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class PerfilConfiguration : IEntityTypeConfiguration<Perfil>
{
    public void Configure(EntityTypeBuilder<Perfil> builder)
    {
        builder.ToTable("Perfil");

        builder.HasKey(p => p.PerfilId);

        builder.Property(p => p.NombrePerfil).HasMaxLength(100);
        builder.Property(p => p.DescripcionPerfil).HasColumnType("nvarchar(max)");
        builder.Property(p => p.AspiracionSalarialPesos).HasColumnType("decimal(18,2)");
        builder.Property(p => p.AspiracionSalarialDolares).HasColumnType("decimal(18,2)");
        builder.Property(p => p.EsActivo).HasDefaultValue(true);

        builder.HasOne(p => p.Curriculum)
            .WithMany(c => c.Perfiles)
            .HasForeignKey(p => p.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
