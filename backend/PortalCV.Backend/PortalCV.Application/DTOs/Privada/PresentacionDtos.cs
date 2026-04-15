namespace PortalCV.Application.DTOs.Privada;

public record PresentacionCvDto(
    string PlantillaCodigo,
    int ExperienciaLaboralMesesAcumulados,
    string UrlPublica,
    bool Publicado);

public record UpdatePresentacionCvRequest(string PlantillaCodigo);

public record UpdateCurriculumPublicacionRequest(bool Publicado);
