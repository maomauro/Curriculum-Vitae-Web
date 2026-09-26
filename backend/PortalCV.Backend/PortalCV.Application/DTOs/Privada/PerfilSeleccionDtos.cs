namespace PortalCV.Application.DTOs.Privada;

/// <summary>Cuerpo de POST /api/cv/ofertas/seleccionar-perfil. La oferta puede no estar
/// persistida todavía (se llama justo después de analizar, antes de "Continuar").</summary>
public record SeleccionarPerfilRequest(string Cargo, string Empresa, string? Descripcion);

/// <summary>Resultado de la selección de perfil (Fase 3) -- todavía no aplica nada, el
/// front lo usa para preseleccionar el combo de "Perfil sugerido" y el usuario puede
/// cambiarlo antes de continuar. Siempre apunta a un Perfil ya existente del candidato
/// -- este flujo ya no ofrece crear uno nuevo (ver PerfilSeleccionService).</summary>
public record PerfilSugeridoDto(
    int PerfilId,
    string PerfilNombre,
    string Razon,
    /// <summary>true si el CV todavía no tiene una versión activa propia de
    /// SELECTOR_PERFIL y se usó el prompt por defecto del sistema.</summary>
    bool PromptPorDefecto);
