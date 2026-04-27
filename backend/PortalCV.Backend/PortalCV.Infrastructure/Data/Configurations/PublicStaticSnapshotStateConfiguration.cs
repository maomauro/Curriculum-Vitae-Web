using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Data.Configurations;

public class PublicStaticSnapshotStateConfiguration : IEntityTypeConfiguration<PublicStaticSnapshotState>
{
    public void Configure(EntityTypeBuilder<PublicStaticSnapshotState> builder)
    {
        builder.ToTable("PublicStaticSnapshotState");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedNever();

        builder.Property(x => x.SiteSnapshotStale)
            .IsRequired();
    }
}
