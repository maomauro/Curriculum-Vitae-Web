namespace PortalCV.Application.DTOs.Privada;

public record ReferenciaDto(
    int ReferenciaId,
    string TipoReferencia,
    int? ExperienciaId,
    string Nombre,
    string? Apellido,
    string? Email,
    string? Telefono,
    string? Parentesco,
    string? Cargo,
    string? Empresa,
    string? Relacion,
    string? Observaciones,
    string? AdjuntoSoporte,
    DateTime FechaRegistro,
    bool MostrarEnCv = true);

public record UpsertReferenciaRequest(
    string TipoReferencia,
    int? ExperienciaId,
    string Nombre,
    string? Apellido,
    string? Email,
    string? Telefono,
    string? Parentesco,
    string? Cargo,
    string? Empresa,
    string? Relacion,
    string? Observaciones,
    string? AdjuntoSoporte,
    bool? MostrarEnCv = null);

public sealed class UpdateReferenciaVisibilidadRequest
{
    public bool MostrarEnCv { get; set; }
}

