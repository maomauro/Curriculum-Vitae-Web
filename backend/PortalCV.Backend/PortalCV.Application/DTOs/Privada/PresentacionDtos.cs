namespace PortalCV.Application.DTOs.Privada;

public record PresentacionCvDto(string PlantillaCodigo, int ExperienciaLaboralMesesAcumulados);

public record UpdatePresentacionCvRequest(string PlantillaCodigo);
