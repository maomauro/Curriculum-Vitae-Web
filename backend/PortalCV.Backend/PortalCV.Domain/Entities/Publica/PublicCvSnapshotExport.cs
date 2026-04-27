namespace PortalCV.Domain.Entities;

/// <summary>Una fila por CV publicado: JSON de un elemento del snapshot público (mismo shape que <c>items[]</c>).</summary>
public class PublicCvSnapshotExport
{
    public int CurriculumId { get; set; }
    public string ItemJson { get; set; } = "{}";
    public DateTime UpdatedAtUtc { get; set; }

    public Curriculum? Curriculum { get; set; }
}
