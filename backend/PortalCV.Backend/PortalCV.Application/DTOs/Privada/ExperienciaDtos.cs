namespace PortalCV.Application.DTOs.Privada;

public record ExperienciaDto(
    int ExperienciaId,
    string? Empresa,
    string? Cargo,
    string? Sector,
    DateOnly? FechaInicio,
    DateOnly? FechaFin,
    string? TipoContrato,
    string? MotivoRetiro,
    string? Funciones,
    bool EsActual,
    bool MostrarEnCv,
    string? AdjuntoSoporte,
    DateTime FechaRegistro);

/// <summary>
/// Cuerpo PUT/POST de experiencia. Clase (no record posicional) para que System.Text.Json
/// deserialice <c>mostrarEnCv</c> de forma fiable.
/// </summary>
public class UpsertExperienciaRequest
{
    public string? Empresa { get; set; }
    public string? Cargo { get; set; }
    public string? Sector { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public string? TipoContrato { get; set; }
    public string? MotivoRetiro { get; set; }
    public string? Funciones { get; set; }
    public bool EsActual { get; set; }
    public string? AdjuntoSoporte { get; set; }
    /// <summary>Si es null en JSON, el servicio asume true (retrocompatibilidad).</summary>
    public bool? MostrarEnCv { get; set; }
}

public class UpdateExperienciaVisibilidadRequest
{
    public bool MostrarEnCv { get; set; }
}

