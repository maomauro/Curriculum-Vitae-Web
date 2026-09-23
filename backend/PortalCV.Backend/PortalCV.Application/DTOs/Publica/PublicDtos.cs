using System.Text.Json.Serialization;
using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.DTOs.Publica;

public record BuscarCvsQuery(
    string? Ciudad = null,
    string? Habilidad = null,
    string? PalabraClave = null,
    int Page = 1,
    int PageSize = 12);

public record CvListadoItemDto(
    int CurriculumId,
    string UrlPublica,
    string? NombreCompleto,
    string? FotoUrl,
    string? Ciudad,
    string? Pais,
    string? NombrePerfil,
    int ContadorVisitas,
    int ContadorContactos,
    IEnumerable<string> Habilidades);

public record CvDetalleDto(
    int CurriculumId,
    string UrlPublica,
    /// <summary>Código de plantilla (minúsculas): clasico, profesional, ats, corporativo, ejecutivo.</summary>
    string PlantillaCodigo,
    int ExperienciaLaboralMesesAcumulados,
    PersonalesPublicoDto? Personales,
    IEnumerable<PerfilPublicoDto> Perfiles,
    IEnumerable<ExperienciaPublicoDto> Experiencias,
    IEnumerable<FormacionPublicoDto> Formaciones,
    IEnumerable<HabilidadPublicoDto> Habilidades,
    IEnumerable<ProyectoPublicoDto> Proyectos,
    IEnumerable<ReferenciaPublicoDto> Referencias,
    IEnumerable<RedSocialPublicoDto> RedesSociales,
    /// <summary>Interruptor maestro (VisibilidadSeccion <c>dashboard.publico</c>). Si es false, no se muestra el dashboard público.</summary>
    bool DashboardPublicoActivo,
    /// <summary>Métricas en dashboard público (maestro ∧ <c>dashboard.metricas</c>).</summary>
    bool DashboardMostrarMetricas,
    /// <summary>Gráficas en dashboard público (maestro ∧ <c>dashboard.graficas</c>).</summary>
    bool DashboardMostrarGraficas,
    /// <summary>Pestaña "Información profesional" del CV público (VisibilidadSeccion <c>profesional.publico</c>).</summary>
    bool InformacionProfesionalPublicaActiva,
    /// <summary>Pestaña "Hoja de vida" del CV público (VisibilidadSeccion <c>hoja-de-vida.publico</c>).</summary>
    bool HojaDeVidaPublicaActiva,
    /// <summary>Contenido del CV generado por IA del Perfil marcado como activo
    /// (<c>Perfil.EsActivo</c>) -- null si no hay Perfil activo o el activo todavía no
    /// tiene un CvGenerado. Mismo shape que consume "Mi CV" en la zona privada.</summary>
    ContenidoCvGeneradoDto? HojaDeVidaContenido,
    /// <summary>Filas crudas de VisibilidadSeccion (secciones/atributos de "Información Personal" y
    /// "Información Profesional") para que el frontend filtre el consolidado -- mismo criterio que
    /// usaba antes la vista privada. Nota: las colecciones (Proyectos, Habilidades, Formaciones, etc.)
    /// viajan completas igual; lo que decide esta lista es solo qué se renderiza, no qué se envía --
    /// el filtrado real de datos ocurre en PublicCvService, ver mostrarEmail/mostrarTelefono.</summary>
    IEnumerable<VisibilidadSeccionPublicaDto> VisibilidadSeccion);

public record VisibilidadSeccionPublicaDto(string Seccion, bool Visible);

public record PersonalesPublicoDto(
    string? NombreCompleto,
    string? FotoUrl,
    string? Ciudad,
    string? Pais,
    string? Celular,
    string? Email);

public record PerfilPublicoDto(
    int PerfilId,
    string? NombrePerfil,
    string? DescripcionPerfil,
    decimal? ExperienciaPerfilAnios,
    decimal? AspiracionSalarialPesos,
    decimal? AspiracionSalarialDolares,
    bool EsActivo);

public record ExperienciaPublicoDto(
    int ExperienciaId,
    string? Empresa,
    string? Cargo,
    string? Sector,
    DateOnly? FechaInicio,
    DateOnly? FechaFin,
    bool EsActual,
    string? Funciones,
    string? TipoContrato,
    /// <summary>Solo presente si el visitante tiene permitido ver el soporte
    /// (VisibilidadSeccion <c>experiencia.soporte-certificacion-laboral</c>).</summary>
    string? AdjuntoSoporte);

public record FormacionPublicoDto(
    int FormacionId,
    string? Titulo,
    string? Institucion,
    string? Area,
    string? TipoFormacion,
    DateOnly? FechaInicio,
    DateOnly? FechaFin,
    /// <summary>Solo presente si el visitante tiene permitido descargar el soporte para el
    /// bloque de este tipo de formación (ver PublicCvService.VisibleDescargarSoporteFormacion).</summary>
    string? AdjuntoSoporte);

public record HabilidadPublicoDto(
    int HabilidadId,
    string Nombre,
    string? Tipo,
    string? Nivel,
    string? Descripcion,
    string? NivelLectura,
    string? NivelEscritura,
    string? NivelEscucha,
    string? NivelHabla);

public record ProyectoPublicoDto(
    int ProyectoId,
    string? NombreProyecto,
    string? Rol,
    string? StackTecnologico,
    string? Aporte,
    string? Logro,
    int? EquipoTamano,
    int? DuracionMeses);

public record ReferenciaPublicoDto(
    int ReferenciaId,
    string TipoReferencia,
    string Nombre,
    string? Apellido,
    string? Cargo,
    string? Empresa);

public record RedSocialPublicoDto(
    int RedSocialId,
    string NombreRed,
    string? LinkPublico,
    string? UsuarioContacto);

public record ContactarCvRequest(
    string? Nombre,
    [property: JsonPropertyName("email")] string? Correo,
    string? Empresa,
    string? MotivoContacto,
    string? Asunto,
    string? ComoMeEncontraste,
    string? Mensaje);

/// <summary>Registro de impresión / PDF del CV público (mismo UUID anónimo que en <c>vid</c> del detalle).</summary>
public record RegistrarImpresionCvRequest(string? UrlPublica, string? VisitanteAnonimoId = null);

public record CvEstadisticasDto(
    int CurriculumId,
    string UrlPublica,
    int TotalVisitas,
    int TotalContactos,
    DateTime? UltimaVisita,
    DateTime FechaActualizacion);

public record FiltrosPublicosDto(
    IEnumerable<string> Ciudades,
    IEnumerable<string> Habilidades);

