using System.Text.Json.Serialization;

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
    bool DashboardMostrarGraficas);

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
    string? TipoContrato);

public record FormacionPublicoDto(
    int FormacionId,
    string? Titulo,
    string? Institucion,
    string? Area,
    string? TipoFormacion,
    DateOnly? FechaInicio,
    DateOnly? FechaFin);

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

