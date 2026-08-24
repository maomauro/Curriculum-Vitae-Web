namespace PortalCV.Application.DTOs.Privada;

public record PerfilDto(
    int PerfilId,
    string? NombrePerfil,
    string? DescripcionPerfil,
    decimal? ExperienciaPerfilAnios,
    decimal? AspiracionSalarialPesos,
    decimal? AspiracionSalarialDolares,
    bool EsActivo,
    bool MostrarExperienciaPerfil = true,
    bool MostrarAspiracionSalarial = true);

public record UpsertPerfilRequest(
    string? NombrePerfil,
    string? DescripcionPerfil,
    decimal? ExperienciaPerfilAnios,
    decimal? AspiracionSalarialPesos,
    decimal? AspiracionSalarialDolares,
    bool EsActivo = true,
    bool MostrarExperienciaPerfil = true,
    bool MostrarAspiracionSalarial = true);

/// <summary>Cuerpo de POST /api/cv/perfiles/generar-ia. Enfoque es una frase corta del
/// usuario (ej. "Arquitecto de Datos") que la IA combina con su Experiencia/Formación/
/// Proyectos/Habilidades reales para redactar el borrador del perfil.</summary>
public record GenerarPerfilConIaRequest(string Enfoque);

/// <summary>Borrador de perfil sugerido por IA -- no persiste nada, el usuario lo revisa
/// y edita en el formulario de "Nuevo perfil" antes de guardar.</summary>
public record PerfilGeneradoIaDto(
    string NombrePerfil,
    string DescripcionPerfil,
    /// <summary>true si el CV todavía no tiene una versión activa propia de
    /// GENERADOR_PERFIL y se usó el prompt por defecto del sistema.</summary>
    bool PromptPorDefecto);

/// <summary>Idea de enfoque sugerida por IA a partir de todo el currículum -- no crea ni
/// genera nada por sí sola, solo precarga el campo "enfoque" del formulario de "Nuevo
/// perfil" (ver GenerarPerfilConIaRequest).</summary>
public record EnfoqueSugeridoDto(string Nombre, string Razon);

/// <summary>Respuesta de POST /api/cv/perfiles/sugerir-enfoques. No persiste nada.</summary>
public record SugerirEnfoquesPerfilResponse(
    IReadOnlyList<EnfoqueSugeridoDto> Sugerencias,
    /// <summary>true si el CV todavía no tiene una versión activa propia de
    /// SUGERIDOR_ENFOQUE_PERFIL y se usó el prompt por defecto del sistema.</summary>
    bool PromptPorDefecto);

