using Microsoft.EntityFrameworkCore;
using PortalCV.Application.DTOs.Curriculum;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class CvEditorService : ICvEditorService
{
    private readonly PortalCvDbContext _context;

    public CvEditorService(PortalCvDbContext context)
    {
        _context = context;
    }

    // ── Personales (1:1) ──────────────────────────────────────────────────────

    public async Task<PersonalesDto?> GetPersonalesAsync(int curriculumId, CancellationToken ct = default)
    {
        var e = await _context.Personales
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.CurriculumId == curriculumId, ct);
        return e is null ? null : MapPersonales(e);
    }

    public async Task<PersonalesDto> UpsertPersonalesAsync(int curriculumId, UpsertPersonalesRequest r, CancellationToken ct = default)
    {
        var existing = await _context.Personales
            .FirstOrDefaultAsync(p => p.CurriculumId == curriculumId, ct);

        if (existing is null)
        {
            existing = new Personales { CurriculumId = curriculumId };
            _context.Personales.Add(existing);
        }

        existing.TipoIdentificacion = r.TipoIdentificacion;
        existing.NumeroDocumento = r.NumeroDocumento;
        existing.FechaExpedicion = r.FechaExpedicion;
        existing.LugarExpedicion = r.LugarExpedicion;
        existing.LibretaMilitarNumero = r.LibretaMilitarNumero;
        existing.LibretaMilitarClase = r.LibretaMilitarClase;
        existing.PasaporteNumero = r.PasaporteNumero;
        existing.PasaporteVigencia = r.PasaporteVigencia;
        existing.VisaNumero = r.VisaNumero;
        existing.VisaVigencia = r.VisaVigencia;
        existing.VisaClase = r.VisaClase;
        existing.PrimerNombre = r.PrimerNombre;
        existing.SegundoNombre = r.SegundoNombre;
        existing.PrimerApellido = r.PrimerApellido;
        existing.SegundoApellido = r.SegundoApellido;
        existing.FechaNacimiento = r.FechaNacimiento;
        existing.LugarNacimiento = r.LugarNacimiento;
        existing.Genero = r.Genero;
        existing.Nacionalidad = r.Nacionalidad;
        existing.TipoSangre = r.TipoSangre;
        existing.EPS = r.EPS;
        existing.Pencion = r.Pencion;
        existing.Cesantias = r.Cesantias;
        existing.Email = r.Email;
        existing.Celular = r.Celular;
        existing.TelefonoFijo = r.TelefonoFijo;
        existing.Pais = r.Pais;
        existing.Departamento = r.Departamento;
        existing.Ciudad = r.Ciudad;
        existing.Barrio = r.Barrio;
        existing.CodigoPostal = r.CodigoPostal;
        existing.Direccion = r.Direccion;
        existing.TipoResidencia = r.TipoResidencia;
        existing.FotoUrl = r.FotoUrl;
        existing.PrivacidadEmail = r.PrivacidadEmail;
        existing.PrivacidadTelefono = r.PrivacidadTelefono;

        await _context.SaveChangesAsync(ct);
        return MapPersonales(existing);
    }

    // ── Perfil ────────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<PerfilDto>> GetPerfilesAsync(int curriculumId, CancellationToken ct = default)
        => await _context.Perfiles.AsNoTracking()
            .Where(p => p.CurriculumId == curriculumId)
            .Select(p => MapPerfil(p)).ToListAsync(ct);

    public async Task<PerfilDto> CreatePerfilAsync(int curriculumId, UpsertPerfilRequest r, CancellationToken ct = default)
    {
        var e = new Perfil
        {
            CurriculumId = curriculumId,
            NombrePerfil = r.NombrePerfil,
            DescripcionPerfil = r.DescripcionPerfil,
            AspiracionSalarialPesos = r.AspiracionSalarialPesos,
            AspiracionSalarialDolares = r.AspiracionSalarialDolares,
            EsActivo = r.EsActivo
        };
        _context.Perfiles.Add(e);
        await _context.SaveChangesAsync(ct);
        return MapPerfil(e);
    }

    public async Task<PerfilDto> UpdatePerfilAsync(int curriculumId, int id, UpsertPerfilRequest r, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.Perfiles, id, curriculumId, ct);
        e.NombrePerfil = r.NombrePerfil;
        e.DescripcionPerfil = r.DescripcionPerfil;
        e.AspiracionSalarialPesos = r.AspiracionSalarialPesos;
        e.AspiracionSalarialDolares = r.AspiracionSalarialDolares;
        e.EsActivo = r.EsActivo;
        await _context.SaveChangesAsync(ct);
        return MapPerfil(e);
    }

    public async Task DeletePerfilAsync(int curriculumId, int id, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.Perfiles, id, curriculumId, ct);
        _context.Perfiles.Remove(e);
        await _context.SaveChangesAsync(ct);
    }

    // ── Experiencia ───────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<ExperienciaDto>> GetExperienciasAsync(int curriculumId, CancellationToken ct = default)
        => await _context.Experiencias.AsNoTracking()
            .Where(e => e.CurriculumId == curriculumId)
            .OrderByDescending(e => e.FechaInicio)
            .Select(e => MapExperiencia(e)).ToListAsync(ct);

    public async Task<ExperienciaDto> CreateExperienciaAsync(int curriculumId, UpsertExperienciaRequest r, CancellationToken ct = default)
    {
        var e = new Experiencia
        {
            CurriculumId = curriculumId,
            Empresa = r.Empresa, Cargo = r.Cargo, Sector = r.Sector,
            FechaInicio = r.FechaInicio, FechaFin = r.FechaFin,
            TipoContrato = r.TipoContrato, MotivoRetiro = r.MotivoRetiro,
            Funciones = r.Funciones, EsActual = r.EsActual,
            AdjuntoSoporte = r.AdjuntoSoporte,
            FechaRegistro = DateTime.UtcNow
        };
        _context.Experiencias.Add(e);
        await _context.SaveChangesAsync(ct);
        return MapExperiencia(e);
    }

    public async Task<ExperienciaDto> UpdateExperienciaAsync(int curriculumId, int id, UpsertExperienciaRequest r, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.Experiencias, id, curriculumId, ct);
        e.Empresa = r.Empresa; e.Cargo = r.Cargo; e.Sector = r.Sector;
        e.FechaInicio = r.FechaInicio; e.FechaFin = r.FechaFin;
        e.TipoContrato = r.TipoContrato; e.MotivoRetiro = r.MotivoRetiro;
        e.Funciones = r.Funciones; e.EsActual = r.EsActual;
        e.AdjuntoSoporte = r.AdjuntoSoporte;
        await _context.SaveChangesAsync(ct);
        return MapExperiencia(e);
    }

    public async Task DeleteExperienciaAsync(int curriculumId, int id, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.Experiencias, id, curriculumId, ct);
        _context.Experiencias.Remove(e);
        await _context.SaveChangesAsync(ct);
    }

    // ── Formación ─────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<FormacionDto>> GetFormacionesAsync(int curriculumId, CancellationToken ct = default)
        => await _context.Formaciones.AsNoTracking()
            .Where(f => f.CurriculumId == curriculumId)
            .OrderByDescending(f => f.FechaInicio)
            .Select(f => MapFormacion(f)).ToListAsync(ct);

    public async Task<FormacionDto> CreateFormacionAsync(int curriculumId, UpsertFormacionRequest r, CancellationToken ct = default)
    {
        var e = new Formacion
        {
            CurriculumId = curriculumId,
            Titulo = r.Titulo, Institucion = r.Institucion, Area = r.Area,
            FechaInicio = r.FechaInicio, FechaFin = r.FechaFin,
            TipoFormacion = r.TipoFormacion, Descripcion = r.Descripcion,
            AdjuntoSoporte = r.AdjuntoSoporte, FechaVigencia = r.FechaVigencia,
            DuracionHoras = r.DuracionHoras
        };
        _context.Formaciones.Add(e);
        await _context.SaveChangesAsync(ct);
        return MapFormacion(e);
    }

    public async Task<FormacionDto> UpdateFormacionAsync(int curriculumId, int id, UpsertFormacionRequest r, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.Formaciones, id, curriculumId, ct);
        e.Titulo = r.Titulo; e.Institucion = r.Institucion; e.Area = r.Area;
        e.FechaInicio = r.FechaInicio; e.FechaFin = r.FechaFin;
        e.TipoFormacion = r.TipoFormacion; e.Descripcion = r.Descripcion;
        e.AdjuntoSoporte = r.AdjuntoSoporte; e.FechaVigencia = r.FechaVigencia;
        e.DuracionHoras = r.DuracionHoras;
        await _context.SaveChangesAsync(ct);
        return MapFormacion(e);
    }

    public async Task DeleteFormacionAsync(int curriculumId, int id, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.Formaciones, id, curriculumId, ct);
        _context.Formaciones.Remove(e);
        await _context.SaveChangesAsync(ct);
    }

    // ── Habilidades ───────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<HabilidadDto>> GetHabilidadesAsync(int curriculumId, CancellationToken ct = default)
        => await _context.Habilidades.AsNoTracking()
            .Where(h => h.CurriculumId == curriculumId)
            .Select(h => MapHabilidad(h)).ToListAsync(ct);

    public async Task<HabilidadDto> CreateHabilidadAsync(int curriculumId, UpsertHabilidadRequest r, CancellationToken ct = default)
    {
        var e = new Habilidad
        {
            CurriculumId = curriculumId, Nombre = r.Nombre, Tipo = r.Tipo,
            Nivel = r.Nivel, Descripcion = r.Descripcion,
            NivelLectura = r.NivelLectura, NivelEscritura = r.NivelEscritura,
            NivelEscucha = r.NivelEscucha, NivelHabla = r.NivelHabla
        };
        _context.Habilidades.Add(e);
        await _context.SaveChangesAsync(ct);
        return MapHabilidad(e);
    }

    public async Task<HabilidadDto> UpdateHabilidadAsync(int curriculumId, int id, UpsertHabilidadRequest r, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.Habilidades, id, curriculumId, ct);
        e.Nombre = r.Nombre; e.Tipo = r.Tipo; e.Nivel = r.Nivel; e.Descripcion = r.Descripcion;
        e.NivelLectura = r.NivelLectura; e.NivelEscritura = r.NivelEscritura;
        e.NivelEscucha = r.NivelEscucha; e.NivelHabla = r.NivelHabla;
        await _context.SaveChangesAsync(ct);
        return MapHabilidad(e);
    }

    public async Task DeleteHabilidadAsync(int curriculumId, int id, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.Habilidades, id, curriculumId, ct);
        _context.Habilidades.Remove(e);
        await _context.SaveChangesAsync(ct);
    }

    // ── Proyectos ─────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<ProyectoDto>> GetProyectosAsync(int curriculumId, CancellationToken ct = default)
        => await _context.Proyectos.AsNoTracking()
            .Where(p => p.CurriculumId == curriculumId)
            .Select(p => MapProyecto(p)).ToListAsync(ct);

    public async Task<ProyectoDto> CreateProyectoAsync(int curriculumId, UpsertProyectoRequest r, CancellationToken ct = default)
    {
        var e = new Proyecto
        {
            CurriculumId = curriculumId, NombreProyecto = r.NombreProyecto, Rol = r.Rol,
            EquipoTamano = r.EquipoTamano, DuracionMeses = r.DuracionMeses,
            StackTecnologico = r.StackTecnologico, Aporte = r.Aporte,
            Logro = r.Logro, Desafio = r.Desafio
        };
        _context.Proyectos.Add(e);
        await _context.SaveChangesAsync(ct);
        return MapProyecto(e);
    }

    public async Task<ProyectoDto> UpdateProyectoAsync(int curriculumId, int id, UpsertProyectoRequest r, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.Proyectos, id, curriculumId, ct);
        e.NombreProyecto = r.NombreProyecto; e.Rol = r.Rol;
        e.EquipoTamano = r.EquipoTamano; e.DuracionMeses = r.DuracionMeses;
        e.StackTecnologico = r.StackTecnologico; e.Aporte = r.Aporte;
        e.Logro = r.Logro; e.Desafio = r.Desafio;
        await _context.SaveChangesAsync(ct);
        return MapProyecto(e);
    }

    public async Task DeleteProyectoAsync(int curriculumId, int id, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.Proyectos, id, curriculumId, ct);
        _context.Proyectos.Remove(e);
        await _context.SaveChangesAsync(ct);
    }

    // ── Referencias ───────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<ReferenciaDto>> GetReferenciasAsync(int curriculumId, CancellationToken ct = default)
        => await _context.Referencias.AsNoTracking()
            .Where(r => r.CurriculumId == curriculumId)
            .Select(r => MapReferencia(r)).ToListAsync(ct);

    public async Task<ReferenciaDto> CreateReferenciaAsync(int curriculumId, UpsertReferenciaRequest r, CancellationToken ct = default)
    {
        var e = new Referencia
        {
            CurriculumId = curriculumId, TipoReferencia = r.TipoReferencia,
            ExperienciaId = r.ExperienciaId, Nombre = r.Nombre, Apellido = r.Apellido,
            Email = r.Email, Telefono = r.Telefono, Parentesco = r.Parentesco,
            Cargo = r.Cargo, Empresa = r.Empresa, Relacion = r.Relacion,
            Observaciones = r.Observaciones, AdjuntoSoporte = r.AdjuntoSoporte,
            FechaRegistro = DateTime.UtcNow
        };
        _context.Referencias.Add(e);
        await _context.SaveChangesAsync(ct);
        return MapReferencia(e);
    }

    public async Task<ReferenciaDto> UpdateReferenciaAsync(int curriculumId, int id, UpsertReferenciaRequest r, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.Referencias, id, curriculumId, ct);
        e.TipoReferencia = r.TipoReferencia; e.ExperienciaId = r.ExperienciaId;
        e.Nombre = r.Nombre; e.Apellido = r.Apellido; e.Email = r.Email;
        e.Telefono = r.Telefono; e.Parentesco = r.Parentesco; e.Cargo = r.Cargo;
        e.Empresa = r.Empresa; e.Relacion = r.Relacion; e.Observaciones = r.Observaciones;
        e.AdjuntoSoporte = r.AdjuntoSoporte;
        await _context.SaveChangesAsync(ct);
        return MapReferencia(e);
    }

    public async Task DeleteReferenciaAsync(int curriculumId, int id, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.Referencias, id, curriculumId, ct);
        _context.Referencias.Remove(e);
        await _context.SaveChangesAsync(ct);
    }

    // ── Redes Sociales ────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<RedSocialDto>> GetRedesSocialesAsync(int curriculumId, CancellationToken ct = default)
        => await _context.RedesSociales.AsNoTracking()
            .Where(r => r.CurriculumId == curriculumId)
            .Select(r => MapRedSocial(r)).ToListAsync(ct);

    public async Task<RedSocialDto> CreateRedSocialAsync(int curriculumId, UpsertRedSocialRequest r, CancellationToken ct = default)
    {
        var e = new RedSocial { CurriculumId = curriculumId, NombreRed = r.NombreRed, LinkPublico = r.LinkPublico, UsuarioContacto = r.UsuarioContacto };
        _context.RedesSociales.Add(e);
        await _context.SaveChangesAsync(ct);
        return MapRedSocial(e);
    }

    public async Task<RedSocialDto> UpdateRedSocialAsync(int curriculumId, int id, UpsertRedSocialRequest r, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.RedesSociales, id, curriculumId, ct);
        e.NombreRed = r.NombreRed; e.LinkPublico = r.LinkPublico; e.UsuarioContacto = r.UsuarioContacto;
        await _context.SaveChangesAsync(ct);
        return MapRedSocial(e);
    }

    public async Task DeleteRedSocialAsync(int curriculumId, int id, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.RedesSociales, id, curriculumId, ct);
        _context.RedesSociales.Remove(e);
        await _context.SaveChangesAsync(ct);
    }

    // ── Familiares ────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<FamiliarContactoDto>> GetFamiliaresAsync(int curriculumId, CancellationToken ct = default)
        => await _context.FamiliarsContacto.AsNoTracking()
            .Where(f => f.CurriculumId == curriculumId)
            .Select(f => MapFamiliar(f)).ToListAsync(ct);

    public async Task<FamiliarContactoDto> CreateFamiliarAsync(int curriculumId, UpsertFamiliarContactoRequest r, CancellationToken ct = default)
    {
        var e = new FamiliarContacto
        {
            CurriculumId = curriculumId, Parentesco = r.Parentesco, Nombres = r.Nombres,
            Apellidos = r.Apellidos, Email = r.Email, Telefono = r.Telefono,
            EsContactoPrincipal = r.EsContactoPrincipal
        };
        _context.FamiliarsContacto.Add(e);
        await _context.SaveChangesAsync(ct);
        return MapFamiliar(e);
    }

    public async Task<FamiliarContactoDto> UpdateFamiliarAsync(int curriculumId, int id, UpsertFamiliarContactoRequest r, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.FamiliarsContacto, id, curriculumId, ct);
        e.Parentesco = r.Parentesco; e.Nombres = r.Nombres; e.Apellidos = r.Apellidos;
        e.Email = r.Email; e.Telefono = r.Telefono; e.EsContactoPrincipal = r.EsContactoPrincipal;
        await _context.SaveChangesAsync(ct);
        return MapFamiliar(e);
    }

    public async Task DeleteFamiliarAsync(int curriculumId, int id, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(_context.FamiliarsContacto, id, curriculumId, ct);
        _context.FamiliarsContacto.Remove(e);
        await _context.SaveChangesAsync(ct);
    }

    // ── Visibilidad ───────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<VisibilidadSeccionDto>> GetVisibilidadAsync(int curriculumId, CancellationToken ct = default)
        => await _context.VisibilidadesSeccion.AsNoTracking()
            .Where(v => v.CurriculumId == curriculumId)
            .Select(v => new VisibilidadSeccionDto(v.VisibilidadSeccionId, v.NombreSeccion, v.EsVisible))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<VisibilidadSeccionDto>> UpdateVisibilidadAsync(
        int curriculumId, IEnumerable<UpdateVisibilidadRequest> cambios, CancellationToken ct = default)
    {
        var existentes = await _context.VisibilidadesSeccion
            .Where(v => v.CurriculumId == curriculumId)
            .ToListAsync(ct);

        foreach (var cambio in cambios)
        {
            var existing = existentes.FirstOrDefault(v => v.NombreSeccion == cambio.NombreSeccion);
            if (existing is null)
            {
                _context.VisibilidadesSeccion.Add(new VisibilidadSeccion
                {
                    CurriculumId = curriculumId,
                    NombreSeccion = cambio.NombreSeccion,
                    EsVisible = cambio.EsVisible
                });
            }
            else
            {
                existing.EsVisible = cambio.EsVisible;
            }
        }

        await _context.SaveChangesAsync(ct);
        return await GetVisibilidadAsync(curriculumId, ct);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static async Task<T> GetOwnedOrThrowAsync<T>(
        DbSet<T> dbSet, int id, int curriculumId, CancellationToken ct) where T : class
    {
        var entity = await dbSet.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"{typeof(T).Name} {id} no encontrado.");

        // Verificar ownership via reflexión en la propiedad CurriculumId
        var prop = typeof(T).GetProperty("CurriculumId");
        if (prop is not null && (int)(prop.GetValue(entity) ?? 0) != curriculumId)
            throw new UnauthorizedAccessException($"{typeof(T).Name} {id} no pertenece al curriculum {curriculumId}.");

        return entity;
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private static PersonalesDto MapPersonales(Personales e) => new(
        e.PersonalesId, e.CurriculumId, e.TipoIdentificacion, e.NumeroDocumento,
        e.FechaExpedicion, e.LugarExpedicion, e.LibretaMilitarNumero, e.LibretaMilitarClase,
        e.PasaporteNumero, e.PasaporteVigencia, e.VisaNumero, e.VisaVigencia, e.VisaClase,
        e.PrimerNombre, e.SegundoNombre, e.PrimerApellido, e.SegundoApellido,
        e.FechaNacimiento, e.LugarNacimiento, e.Genero, e.Nacionalidad, e.TipoSangre,
        e.EPS, e.Pencion, e.Cesantias, e.Email, e.Celular, e.TelefonoFijo,
        e.Pais, e.Departamento, e.Ciudad, e.Barrio, e.CodigoPostal, e.Direccion,
        e.TipoResidencia, e.FotoUrl, e.PrivacidadEmail, e.PrivacidadTelefono);

    private static PerfilDto MapPerfil(Perfil e) => new(
        e.PerfilId, e.NombrePerfil, e.DescripcionPerfil,
        e.AspiracionSalarialPesos, e.AspiracionSalarialDolares, e.EsActivo);

    private static ExperienciaDto MapExperiencia(Experiencia e) => new(
        e.ExperienciaId, e.Empresa, e.Cargo, e.Sector, e.FechaInicio, e.FechaFin,
        e.TipoContrato, e.MotivoRetiro, e.Funciones, e.EsActual, e.AdjuntoSoporte, e.FechaRegistro);

    private static FormacionDto MapFormacion(Formacion e) => new(
        e.FormacionId, e.Titulo, e.Institucion, e.Area, e.FechaInicio, e.FechaFin,
        e.TipoFormacion, e.Descripcion, e.AdjuntoSoporte, e.FechaVigencia, e.DuracionHoras);

    private static HabilidadDto MapHabilidad(Habilidad e) => new(
        e.HabilidadId, e.Nombre, e.Tipo, e.Nivel, e.Descripcion,
        e.NivelLectura, e.NivelEscritura, e.NivelEscucha, e.NivelHabla);

    private static ProyectoDto MapProyecto(Proyecto e) => new(
        e.ProyectoId, e.NombreProyecto, e.Rol, e.EquipoTamano, e.DuracionMeses,
        e.StackTecnologico, e.Aporte, e.Logro, e.Desafio);

    private static ReferenciaDto MapReferencia(Referencia e) => new(
        e.ReferenciaId, e.TipoReferencia, e.ExperienciaId, e.Nombre, e.Apellido,
        e.Email, e.Telefono, e.Parentesco, e.Cargo, e.Empresa, e.Relacion,
        e.Observaciones, e.AdjuntoSoporte, e.FechaRegistro);

    private static RedSocialDto MapRedSocial(RedSocial e) => new(
        e.RedSocialId, e.NombreRed, e.LinkPublico, e.UsuarioContacto);

    private static FamiliarContactoDto MapFamiliar(FamiliarContacto e) => new(
        e.FamiliarId, e.Parentesco, e.Nombres, e.Apellidos, e.Email, e.Telefono, e.EsContactoPrincipal);
}
