namespace PortalCV.Domain.Entities;

public class ProveedorIa
{
    public int ProveedorIaId { get; set; }
    public int CurriculumId { get; set; }
    public string Proveedor { get; set; } = string.Empty;
    public string? Nombre { get; set; }
    public string? Modelo { get; set; }
    public string? Endpoint { get; set; }
    public string? ApiKeyCifrada { get; set; }
    public bool EsActivo { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaActualizacion { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
}
