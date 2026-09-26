namespace PortalCV.Domain.Entities;

/// <summary>Conexión de IA global para toda la plataforma (una activa a la vez),
/// administrada por el rol Admin — no pertenece a ningún Curriculum.</summary>
public class ProveedorIa
{
    public int ProveedorIaId { get; set; }
    public string Proveedor { get; set; } = string.Empty;
    public string? Nombre { get; set; }
    public string? Modelo { get; set; }
    public string? Endpoint { get; set; }
    public string? ApiKeyCifrada { get; set; }
    public bool EsActivo { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaActualizacion { get; set; }
}
