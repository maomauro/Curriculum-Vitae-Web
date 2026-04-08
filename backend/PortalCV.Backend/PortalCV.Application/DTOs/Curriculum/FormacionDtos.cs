namespace PortalCV.Application.DTOs.Curriculum;

public record FormacionDto(
    int FormacionId,
    string? Titulo,
    string? Institucion,
    string? Area,
    DateOnly? FechaInicio,
    DateOnly? FechaFin,
    string? TipoFormacion,
    string? Descripcion,
    string? AdjuntoSoporte,
    DateOnly? FechaVigencia,
    int? DuracionHoras);

public record UpsertFormacionRequest(
    string? Titulo,
    string? Institucion,
    string? Area,
    DateOnly? FechaInicio,
    DateOnly? FechaFin,
    string? TipoFormacion,
    string? Descripcion,
    string? AdjuntoSoporte,
    DateOnly? FechaVigencia,
    int? DuracionHoras);
