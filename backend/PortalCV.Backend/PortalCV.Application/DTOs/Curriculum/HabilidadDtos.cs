namespace PortalCV.Application.DTOs.Curriculum;

public record HabilidadDto(
    int HabilidadId,
    string Nombre,
    string? Tipo,
    string? Nivel,
    string? Descripcion,
    string? NivelLectura,
    string? NivelEscritura,
    string? NivelEscucha,
    string? NivelHabla);

public record UpsertHabilidadRequest(
    string Nombre,
    string? Tipo,
    string? Nivel,
    string? Descripcion,
    string? NivelLectura,
    string? NivelEscritura,
    string? NivelEscucha,
    string? NivelHabla);
