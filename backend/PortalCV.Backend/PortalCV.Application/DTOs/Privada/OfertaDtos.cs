namespace PortalCV.Application.DTOs.Privada;

public record OfertaDto(
    int OfertaId,
    string Cargo,
    string Empresa,
    string? Descripcion,
    string? CorreoReclutador,
    string? NombreReclutador,
    string TextoOriginal,
    string OrigenEntrada,
    string Estado,
    int? PerfilId,
    DateTime FechaAnalisis,
    DateTime? FechaEnvioCorreo,
    /// <summary>Atributos adicionales de texto libre -- tal cual los redactó el
    /// reclutador, sin clasificar en categorías fijas. Todos opcionales.</summary>
    string? Modalidad = null,
    string? TipoContrato = null,
    string? Moneda = null,
    string? Duracion = null,
    string? Horario = null,
    string? ExperienciaRequerida = null,
    string? StackTecnologico = null,
    string? NivelIdioma = null);

public record UpsertOfertaRequest(
    string Cargo,
    string Empresa,
    string? Descripcion,
    string? CorreoReclutador,
    string? NombreReclutador,
    string TextoOriginal,
    string OrigenEntrada,
    string Estado,
    int? PerfilId,
    string? Modalidad = null,
    string? TipoContrato = null,
    string? Moneda = null,
    string? Duracion = null,
    string? Horario = null,
    string? ExperienciaRequerida = null,
    string? StackTecnologico = null,
    string? NivelIdioma = null);

/// <summary>Resultado de POST /api/cv/ofertas/analizar -- todavía no persistido (el
/// usuario revisa/edita en el paso "resultado" del front y recién ahí se guarda como
/// Oferta, vía el CRUD normal de arriba).</summary>
public record OfertaAnalizadaDto(
    string Cargo,
    string Empresa,
    string? Descripcion,
    string? CorreoReclutador,
    string? NombreReclutador,
    string TextoOriginal,
    string OrigenEntrada,
    /// <summary>true si el CV todavía no tiene una versión activa propia de
    /// EXTRACTOR_OFERTA y se usó el prompt por defecto del sistema en su lugar --
    /// el front lo muestra como aviso discreto con un enlace a Prompts de IA.</summary>
    bool PromptPorDefecto,
    string? Modalidad = null,
    string? TipoContrato = null,
    string? Moneda = null,
    string? Duracion = null,
    string? Horario = null,
    string? ExperienciaRequerida = null,
    string? StackTecnologico = null,
    string? NivelIdioma = null);
