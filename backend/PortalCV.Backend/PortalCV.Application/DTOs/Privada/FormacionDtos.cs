namespace PortalCV.Application.DTOs.Privada;

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
    int? DuracionHoras,
    bool MostrarEnCv);

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
    int? DuracionHoras,
    bool? MostrarEnCv);

public sealed class UpdateFormacionVisibilidadRequest
{
    public bool MostrarEnCv { get; set; }
}

