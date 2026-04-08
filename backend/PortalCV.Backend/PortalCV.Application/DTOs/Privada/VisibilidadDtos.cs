namespace PortalCV.Application.DTOs.Privada;

public record VisibilidadSeccionDto(
    int VisibilidadSeccionId,
    string NombreSeccion,
    bool EsVisible);

public record UpdateVisibilidadRequest(
    string NombreSeccion,
    bool EsVisible);

