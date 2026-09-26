namespace PortalCV.Application.DTOs.Privada;

/// <summary>Una experiencia condensada por la IA: cabecera (cargo, empresa y período en
/// una sola línea de texto) y una selección/resumen de 2-4 funciones reales relevantes
/// al perfil -- la experiencia original puede traer muchas funciones, no se aplanan a
/// una sola frase.</summary>
public record ExperienciaCondensadaDto(string Cabecera, IReadOnlyList<string> Funciones);

/// <summary>Una habilidad seleccionada por la IA -- el nombre lo redacta la IA, el Tipo
/// (Tecnica/Blanda/Idioma/Otra) se resuelve del lado del backend cruzando contra las
/// Habilidades reales del candidato (la IA no lo devuelve), para que la plantilla
/// Corporativo pueda agruparlas en su barra lateral igual que en "Profesional".</summary>
public record HabilidadCondensadaDto(string Nombre, string? Tipo);

/// <summary>Cuerpo serializado en CvGenerado.ContenidoJson -- sin resumen del
/// perfil ni datos de contacto: el encabezado y la sección "Perfil Profesional" de esta
/// vista usan el Perfil y los datos reales de Personales tal cual, nunca los de la IA.</summary>
public record ContenidoCvGeneradoDto(
    IReadOnlyList<ExperienciaCondensadaDto> Experiencia,
    IReadOnlyList<string> Educacion,
    IReadOnlyList<string> Proyectos,
    IReadOnlyList<HabilidadCondensadaDto> Habilidades);

/// <summary>CV general del candidato para un Perfil puntual -- sin oferta de por medio.
/// La IA condensa experiencia/formación/proyectos/habilidades para caber en máximo 3
/// hojas (el resumen/descripción del Perfil no lo toca, se muestra tal cual está
/// guardado); el front lo muestra con la misma apariencia visual (colores, tipografía,
/// foto y encabezado) que "Profesional".</summary>
public record CvGeneradoDto(
    int CvGeneradoId,
    int PerfilId,
    string PerfilNombre,
    ContenidoCvGeneradoDto Contenido,
    DateTime FechaGeneracion,
    /// <summary>true si el CV todavía no tiene una versión activa propia de
    /// GENERADOR_CV_PERFIL y se usó el prompt por defecto del sistema.</summary>
    bool PromptPorDefecto);
