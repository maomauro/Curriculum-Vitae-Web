using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class FamiliarContactoConfiguration : IEntityTypeConfiguration<FamiliarContacto>
{
    public void Configure(EntityTypeBuilder<FamiliarContacto> builder)
    {
        builder.ToTable("FamiliarContacto");

        builder.HasKey(f => f.FamiliarId);

        builder.Property(f => f.Parentesco).HasMaxLength(50);
        builder.Property(f => f.Nombres).HasMaxLength(100);
        builder.Property(f => f.Apellidos).HasMaxLength(100);
        builder.Property(f => f.Email).HasMaxLength(150);
        builder.Property(f => f.Telefono).HasMaxLength(15);
        builder.Property(f => f.EsContactoPrincipal).HasDefaultValue(false);

        builder.HasOne(f => f.Curriculum)
            .WithMany(c => c.FamiliarsContacto)
            .HasForeignKey(f => f.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
