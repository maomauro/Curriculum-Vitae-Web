using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class PublicCvSnapshotExportConfiguration : IEntityTypeConfiguration<PublicCvSnapshotExport>
{
    public void Configure(EntityTypeBuilder<PublicCvSnapshotExport> builder)
    {
        builder.ToTable("PublicCvSnapshotExport");

        builder.HasKey(x => x.CurriculumId);

        builder.Property(x => x.ItemJson)
            .HasColumnType("nvarchar(max)")
            .IsRequired();

        builder.Property(x => x.UpdatedAtUtc)
            .IsRequired();

        builder.HasOne(x => x.Curriculum)
            .WithOne()
            .HasForeignKey<PublicCvSnapshotExport>(x => x.CurriculumId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
