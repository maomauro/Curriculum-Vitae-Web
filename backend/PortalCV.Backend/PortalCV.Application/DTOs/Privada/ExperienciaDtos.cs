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

public record UpsertExperienciaRequest(
    string? Empresa,
    string? Cargo,
    string? Sector,
    DateOnly? FechaInicio,
    DateOnly? FechaFin,
    string? TipoContrato,
    string? MotivoRetiro,
    string? Funciones,
    bool EsActual = false,
    string? AdjuntoSoporte = null,
    /** Si no viene en JSON, se trata como true (retrocompatibilidad). */
    bool? MostrarEnCv = null);

