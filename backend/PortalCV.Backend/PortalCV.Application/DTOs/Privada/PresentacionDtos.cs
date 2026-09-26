namespace PortalCV.Application.DTOs.Privada;

public record PresentacionCvDto(
    string PlantillaCodigo,
    int ExperienciaLaboralMesesAcumulados,
    string UrlPublica,
    bool Publicado);

public record UpdatePresentacionCvRequest(string PlantillaCodigo);

public record UpdateCurriculumPublicacionRequest(bool Publicado);

public record ActualizarUrlPublicaRequest(string UrlPublica);

/// <summary>
/// Resultado de intentar cambiar la URL pública. Si la propuesta ya está en uso por otro CV,
/// <see cref="Disponible"/> es false y <see cref="Sugerencia"/> trae una alternativa libre
/// (mismo criterio de sufijo numérico que usa el registro); el frontend la ofrece para
/// aceptar con un clic en vez de forzar a adivinar un nombre distinto.
/// </summary>
public record ActualizarUrlPublicaResultDto(
    bool Disponible,
    string? Sugerencia,
    PresentacionCvDto? Presentacion);
