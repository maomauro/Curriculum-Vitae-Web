namespace PortalCV.Domain.Entities;

/// <summary>Fila singleton (<c>Id = 1</c>): indica si el JSON estático del repo debe regenerarse.</summary>
public class PublicStaticSnapshotState
{
    public byte Id { get; set; } = 1;
    public bool SiteSnapshotStale { get; set; }
}
