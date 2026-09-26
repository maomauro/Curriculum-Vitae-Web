namespace PortalCV.Application.DTOs.Privada;

public record HabilidadDto(
    int HabilidadId,
    string Nombre,
    string? Tipo,
    string? Nivel,
    string? Descripcion,
    string? NivelLectura,
    string? NivelEscritura,
    string? NivelEscucha,
    string? NivelHabla,
    bool MostrarEnCv);

public record UpsertHabilidadRequest(
    string Nombre,
    string? Tipo,
    string? Nivel,
    string? Descripcion,
    string? NivelLectura,
    string? NivelEscritura,
    string? NivelEscucha,
    string? NivelHabla,
    bool? MostrarEnCv);

public sealed class UpdateHabilidadVisibilidadRequest
{
    public bool MostrarEnCv { get; set; }
}

