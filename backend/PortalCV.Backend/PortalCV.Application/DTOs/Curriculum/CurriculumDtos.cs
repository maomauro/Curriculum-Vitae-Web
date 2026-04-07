namespace PortalCV.Application.DTOs.Curriculum;

// ── Personales ────────────────────────────────────────────────────────────────

public record PersonalesDto(
    int PersonalesId,
    int CurriculumId,
    string? TipoIdentificacion,
    string? NumeroDocumento,
    DateOnly? FechaExpedicion,
    string? LugarExpedicion,
    string? LibretaMilitarNumero,
    string? LibretaMilitarClase,
    string? PasaporteNumero,
    DateOnly? PasaporteVigencia,
    string? VisaNumero,
    DateOnly? VisaVigencia,
    string? VisaClase,
    string PrimerNombre,
    string? SegundoNombre,
    string PrimerApellido,
    string? SegundoApellido,
    DateOnly? FechaNacimiento,
    string? LugarNacimiento,
    string? Genero,
    string? Nacionalidad,
    string? TipoSangre,
    string? EPS,
    string? Pencion,
    string? Cesantias,
    string? Email,
    string? Celular,
    string? TelefonoFijo,
    string? Pais,
    string? Departamento,
    string? Ciudad,
    string? Barrio,
    string? CodigoPostal,
    string? Direccion,
    string? TipoResidencia,
    string? FotoUrl,
    string PrivacidadEmail,
    string PrivacidadTelefono);

public record UpsertPersonalesRequest(
    string? TipoIdentificacion,
    string? NumeroDocumento,
    DateOnly? FechaExpedicion,
    string? LugarExpedicion,
    string? LibretaMilitarNumero,
    string? LibretaMilitarClase,
    string? PasaporteNumero,
    DateOnly? PasaporteVigencia,
    string? VisaNumero,
    DateOnly? VisaVigencia,
    string? VisaClase,
    string PrimerNombre,
    string? SegundoNombre,
    string PrimerApellido,
    string? SegundoApellido,
    DateOnly? FechaNacimiento,
    string? LugarNacimiento,
    string? Genero,
    string? Nacionalidad,
    string? TipoSangre,
    string? EPS,
    string? Pencion,
    string? Cesantias,
    string? Email,
    string? Celular,
    string? TelefonoFijo,
    string? Pais,
    string? Departamento,
    string? Ciudad,
    string? Barrio,
    string? CodigoPostal,
    string? Direccion,
    string? TipoResidencia,
    string? FotoUrl,
    string PrivacidadEmail = "Publico",
    string PrivacidadTelefono = "Publico");

// ── Perfil ────────────────────────────────────────────────────────────────────

public record PerfilDto(
    int PerfilId,
    string? NombrePerfil,
    string? DescripcionPerfil,
    decimal? AspiracionSalarialPesos,
    decimal? AspiracionSalarialDolares,
    bool EsActivo);

public record UpsertPerfilRequest(
    string? NombrePerfil,
    string? DescripcionPerfil,
    decimal? AspiracionSalarialPesos,
    decimal? AspiracionSalarialDolares,
    bool EsActivo = true);

// ── Experiencia ───────────────────────────────────────────────────────────────

public record ExperienciaDto(
    int ExperienciaId,
    string? Empresa,
    string? Cargo,
    string? Sector,
    DateOnly? FechaInicio,
    DateOnly? FechaFin,
    string? TipoContrato,
    string? MotivoRetiro,
    string? Funciones,
    bool EsActual,
    string? AdjuntoSoporte,
    DateTime FechaRegistro);

public record UpsertExperienciaRequest(
    string? Empresa,
    string? Cargo,
    string? Sector,
    DateOnly? FechaInicio,
    DateOnly? FechaFin,
    string? TipoContrato,
    string? MotivoRetiro,
    string? Funciones,
    bool EsActual = false,
    string? AdjuntoSoporte = null);

// ── Formación ─────────────────────────────────────────────────────────────────

public record FormacionDto(
    int FormacionId,
    string? Titulo,
    string? Institucion,
    string? Area,
    DateOnly? FechaInicio,
    DateOnly? FechaFin,
    string? TipoFormacion,
    string? Descripcion,
    string? AdjuntoSoporte,
    DateOnly? FechaVigencia,
    int? DuracionHoras);

public record UpsertFormacionRequest(
    string? Titulo,
    string? Institucion,
    string? Area,
    DateOnly? FechaInicio,
    DateOnly? FechaFin,
    string? TipoFormacion,
    string? Descripcion,
    string? AdjuntoSoporte,
    DateOnly? FechaVigencia,
    int? DuracionHoras);

// ── Habilidad ─────────────────────────────────────────────────────────────────

public record HabilidadDto(
    int HabilidadId,
    string Nombre,
    string? Tipo,
    string? Nivel,
    string? Descripcion,
    string? NivelLectura,
    string? NivelEscritura,
    string? NivelEscucha,
    string? NivelHabla);

public record UpsertHabilidadRequest(
    string Nombre,
    string? Tipo,
    string? Nivel,
    string? Descripcion,
    string? NivelLectura,
    string? NivelEscritura,
    string? NivelEscucha,
    string? NivelHabla);

// ── Proyecto ──────────────────────────────────────────────────────────────────

public record ProyectoDto(
    int ProyectoId,
    string? NombreProyecto,
    string? Rol,
    int? EquipoTamano,
    int? DuracionMeses,
    string? StackTecnologico,
    string? Aporte,
    string? Logro,
    string? Desafio);

public record UpsertProyectoRequest(
    string? NombreProyecto,
    string? Rol,
    int? EquipoTamano,
    int? DuracionMeses,
    string? StackTecnologico,
    string? Aporte,
    string? Logro,
    string? Desafio);

// ── Referencia ────────────────────────────────────────────────────────────────

public record ReferenciaDto(
    int ReferenciaId,
    string TipoReferencia,
    int? ExperienciaId,
    string Nombre,
    string? Apellido,
    string? Email,
    string? Telefono,
    string? Parentesco,
    string? Cargo,
    string? Empresa,
    string? Relacion,
    string? Observaciones,
    string? AdjuntoSoporte,
    DateTime FechaRegistro);

public record UpsertReferenciaRequest(
    string TipoReferencia,
    int? ExperienciaId,
    string Nombre,
    string? Apellido,
    string? Email,
    string? Telefono,
    string? Parentesco,
    string? Cargo,
    string? Empresa,
    string? Relacion,
    string? Observaciones,
    string? AdjuntoSoporte);

// ── Red Social ────────────────────────────────────────────────────────────────

public record RedSocialDto(
    int RedSocialId,
    string NombreRed,
    string? LinkPublico,
    string? UsuarioContacto);

public record UpsertRedSocialRequest(
    string NombreRed,
    string? LinkPublico,
    string? UsuarioContacto);

// ── Familiar / Contacto de emergencia ────────────────────────────────────────

public record FamiliarContactoDto(
    int FamiliarId,
    string? Parentesco,
    string? Nombres,
    string? Apellidos,
    string? Email,
    string? Telefono,
    bool EsContactoPrincipal);

public record UpsertFamiliarContactoRequest(
    string? Parentesco,
    string? Nombres,
    string? Apellidos,
    string? Email,
    string? Telefono,
    bool EsContactoPrincipal = false);

// ── Visibilidad de sección ────────────────────────────────────────────────────

public record VisibilidadSeccionDto(
    int VisibilidadSeccionId,
    string NombreSeccion,
    bool EsVisible);

public record UpdateVisibilidadRequest(
    string NombreSeccion,
    bool EsVisible);
