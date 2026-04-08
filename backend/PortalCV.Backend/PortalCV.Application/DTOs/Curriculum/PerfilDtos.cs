namespace PortalCV.Application.DTOs.Curriculum;

public record PerfilDto(
    int PerfilId,
    string? NombrePerfil,
    string? DescripcionPerfil,
    decimal? AspiracionSalarialPesos,
    decimal? AspiracionSalarialDolares,
    bool EsActivo);

public record UpsertPerfilRequest(
    string? NombrePerfil,
    string? DescripcionPerfil,
    decimal? AspiracionSalarialPesos,
    decimal? AspiracionSalarialDolares,
    bool EsActivo = true);
