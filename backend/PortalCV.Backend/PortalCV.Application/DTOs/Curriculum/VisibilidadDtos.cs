namespace PortalCV.Application.DTOs.Curriculum;

public record VisibilidadSeccionDto(
    int VisibilidadSeccionId,
    string NombreSeccion,
    bool EsVisible);

public record UpdateVisibilidadRequest(
    string NombreSeccion,
    bool EsVisible);
