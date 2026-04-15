namespace PortalCV.Application.DTOs.Privada;

public record PerfilDto(
    int PerfilId,
    string? NombrePerfil,
    string? DescripcionPerfil,
    decimal? ExperienciaPerfilAnios,
    decimal? AspiracionSalarialPesos,
    decimal? AspiracionSalarialDolares,
    bool EsActivo);

public record UpsertPerfilRequest(
    string? NombrePerfil,
    string? DescripcionPerfil,
    decimal? ExperienciaPerfilAnios,
    decimal? AspiracionSalarialPesos,
    decimal? AspiracionSalarialDolares,
    bool EsActivo = true);

