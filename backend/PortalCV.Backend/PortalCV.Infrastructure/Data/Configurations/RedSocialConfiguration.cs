using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class RedSocialConfiguration : IEntityTypeConfiguration<RedSocial>
{
    public void Configure(EntityTypeBuilder<RedSocial> builder)
    {
        builder.ToTable("RedSocial");

        builder.HasKey(r => r.RedSocialId);

        builder.Property(r => r.NombreRed).IsRequired().HasMaxLength(50);
        builder.Property(r => r.LinkPublico).HasMaxLength(500);
        builder.Property(r => r.UsuarioContacto).HasMaxLength(100);

        builder.HasOne(r => r.Curriculum)
            .WithMany(c => c.RedesSociales)
            .HasForeignKey(r => r.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
