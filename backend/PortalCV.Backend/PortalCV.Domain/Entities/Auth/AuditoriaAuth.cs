namespace PortalCV.Domain.Entities;

/// <summary>Registro append-only de eventos de autenticación (login exitoso/fallido, logout).</summary>
public class AuditoriaAuth
{
    public int AuditoriaAuthId { get; set; }
    public DateTime FechaUtc { get; set; }
    public int? ActorUsuarioId { get; set; }
    public string Accion { get; set; } = string.Empty;

    /// <summary>Email involucrado en el intento (aunque no exista usuario, p. ej. login fallido).</summary>
    public string Email { get; set; } = string.Empty;
    public string? DetalleJson { get; set; }

    public Usuario? Actor { get; set; }
}
