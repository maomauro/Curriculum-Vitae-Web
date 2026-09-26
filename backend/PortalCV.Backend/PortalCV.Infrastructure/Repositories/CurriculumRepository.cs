using Microsoft.EntityFrameworkCore;
using PortalCV.Application;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Repositories;

public class CurriculumRepository : GenericRepository<Curriculum>, ICurriculumRepository
{
    /// <summary>Placeholder de 1 byte usado en las proyecciones "SinAdjuntos" -- nunca se
    /// expone al cliente, solo sirve para que "AdjuntoSoporteBytes is not null" siga dando
    /// el resultado correcto sin transferir el archivo real (puede pesar varios MB).</summary>
    private static readonly byte[] MarcadorAdjuntoPresente = { 1 };

    public CurriculumRepository(PortalCvDbContext context) : base(context) { }

    public async Task<Curriculum?> GetByUrlPublicaAsync(string urlPublica, CancellationToken ct = default)
        => await _dbSet
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.Personales)
            .Include(c => c.Perfiles)
            .Include(c => c.Experiencias)
            .Include(c => c.Formaciones)
            .Include(c => c.Habilidades)
            .Include(c => c.Proyectos)
            .Include(c => c.Referencias)
            .Include(c => c.RedesSociales)
            .Include(c => c.VisibilidadesSeccion)
            .FirstOrDefaultAsync(c =>
                c.UrlPublica == urlPublica &&
                c.Estado == CurriculumEstados.Publicado &&
                c.Usuario.Estado == UsuarioEstados.Activo,
                ct);

    public async Task<Curriculum?> GetPublicadoPorIdAsync(int curriculumId, CancellationToken ct = default)
        => await _dbSet
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.Usuario)
            .Include(c => c.Personales)
            .Include(c => c.Perfiles)
            .Include(c => c.Experiencias)
            .Include(c => c.Formaciones)
            .Include(c => c.Habilidades)
            .Include(c => c.Proyectos)
            .Include(c => c.Referencias)
            .Include(c => c.RedesSociales)
            .Include(c => c.VisibilidadesSeccion)
            .FirstOrDefaultAsync(c =>
                c.CurriculumId == curriculumId &&
                c.Estado == CurriculumEstados.Publicado &&
                c.Usuario.Estado == UsuarioEstados.Activo,
                ct);

    public async Task<Curriculum?> GetParaPreviewPublicoPorIdAsync(int curriculumId, CancellationToken ct = default)
        => await _dbSet
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.Personales)
            .Include(c => c.Perfiles)
            .Include(c => c.Experiencias)
            .Include(c => c.Formaciones)
            .Include(c => c.Habilidades)
            .Include(c => c.Proyectos)
            .Include(c => c.Referencias)
            .Include(c => c.RedesSociales)
            .Include(c => c.VisibilidadesSeccion)
            .FirstOrDefaultAsync(c => c.CurriculumId == curriculumId, ct);

    /// <summary>Mismo motivo que CvEditorService.GetExperienciasAsync/GetFormacionesAsync: el
    /// consolidado de "Información profesional" (pública, preview de Configuración) solo
    /// necesita saber si hay adjunto para armar el link de descarga, no los bytes en sí -- un
    /// Include normal de EF materializa igual el archivo completo por cada fila con soporte.</summary>
    public async Task<Curriculum?> GetByUrlPublicaSinAdjuntosAsync(string urlPublica, CancellationToken ct = default)
    {
        var cv = await _dbSet
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.Personales)
            .Include(c => c.Perfiles).ThenInclude(p => p.CvGenerado)
            .Include(c => c.Habilidades)
            .Include(c => c.Proyectos)
            .Include(c => c.Referencias)
            .Include(c => c.RedesSociales)
            .Include(c => c.VisibilidadesSeccion)
            .FirstOrDefaultAsync(c =>
                c.UrlPublica == urlPublica &&
                c.Estado == CurriculumEstados.Publicado &&
                c.Usuario.Estado == UsuarioEstados.Activo,
                ct);
        if (cv is not null) await CargarExperienciasYFormacionesSinAdjuntosAsync(cv, ct);
        return cv;
    }

    /// <summary>Ver <see cref="GetByUrlPublicaSinAdjuntosAsync"/>.</summary>
    public async Task<Curriculum?> GetParaPreviewPublicoPorIdSinAdjuntosAsync(int curriculumId, CancellationToken ct = default)
    {
        var cv = await _dbSet
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.Personales)
            .Include(c => c.Perfiles).ThenInclude(p => p.CvGenerado)
            .Include(c => c.Habilidades)
            .Include(c => c.Proyectos)
            .Include(c => c.Referencias)
            .Include(c => c.RedesSociales)
            .Include(c => c.VisibilidadesSeccion)
            .FirstOrDefaultAsync(c => c.CurriculumId == curriculumId, ct);
        if (cv is not null) await CargarExperienciasYFormacionesSinAdjuntosAsync(cv, ct);
        return cv;
    }

    private async Task CargarExperienciasYFormacionesSinAdjuntosAsync(Curriculum cv, CancellationToken ct)
    {
        cv.Experiencias = await _context.Experiencias.AsNoTracking()
            .Where(e => e.CurriculumId == cv.CurriculumId)
            .Select(e => new Experiencia
            {
                ExperienciaId = e.ExperienciaId,
                CurriculumId = e.CurriculumId,
                Empresa = e.Empresa,
                Cargo = e.Cargo,
                Sector = e.Sector,
                FechaInicio = e.FechaInicio,
                FechaFin = e.FechaFin,
                TipoContrato = e.TipoContrato,
                Funciones = e.Funciones,
                EsActual = e.EsActual,
                MostrarEnCv = e.MostrarEnCv,
                AdjuntoSoporte = e.AdjuntoSoporte,
                AdjuntoSoporteBytes = e.AdjuntoSoporteBytes != null ? MarcadorAdjuntoPresente : null,
            })
            .ToListAsync(ct);

        cv.Formaciones = await _context.Formaciones.AsNoTracking()
            .Where(f => f.CurriculumId == cv.CurriculumId)
            .Select(f => new Formacion
            {
                FormacionId = f.FormacionId,
                CurriculumId = f.CurriculumId,
                Titulo = f.Titulo,
                Institucion = f.Institucion,
                Area = f.Area,
                FechaInicio = f.FechaInicio,
                FechaFin = f.FechaFin,
                TipoFormacion = f.TipoFormacion,
                MostrarEnCv = f.MostrarEnCv,
                AdjuntoSoporte = f.AdjuntoSoporte,
                AdjuntoSoporteBytes = f.AdjuntoSoporteBytes != null ? MarcadorAdjuntoPresente : null,
            })
            .ToListAsync(ct);
    }

    public async Task<Curriculum?> GetByUsuarioIdAsync(int usuarioId, CancellationToken ct = default)
        => await _dbSet
            .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId, ct);

    public async Task<bool> UrlPublicaExisteAsync(string urlPublica, int? excludeCurriculumId = null, CancellationToken ct = default)
        => await _dbSet.AnyAsync(c =>
            c.UrlPublica == urlPublica &&
            (excludeCurriculumId == null || c.CurriculumId != excludeCurriculumId), ct);

    public async Task<(IReadOnlyList<Curriculum> Items, int Total)> BuscarPublicosAsync(
        string? ciudad,
        string? habilidad,
        string? palabraClave,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var query = _dbSet
            .AsNoTracking()
            .Where(c => c.Estado == CurriculumEstados.Publicado && c.Usuario.Estado == UsuarioEstados.Activo)
            .Include(c => c.Personales)
            .Include(c => c.Perfiles.Where(p => p.EsActivo))
            .Include(c => c.Habilidades)
            .Include(c => c.VisibilidadesSeccion)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(ciudad))
            query = query.Where(c => c.Personales != null && c.Personales.Ciudad == ciudad);

        if (!string.IsNullOrWhiteSpace(habilidad))
            query = query.Where(c => c.Habilidades.Any(h => h.Nombre == habilidad));

        if (!string.IsNullOrWhiteSpace(palabraClave))
        {
            var kw = palabraClave.ToLower();
            query = query.Where(c =>
                (c.Personales != null &&
                    (EF.Functions.Like(c.Personales.PrimerNombre.ToLower(), $"%{kw}%") ||
                     EF.Functions.Like(c.Personales.PrimerApellido.ToLower(), $"%{kw}%") ||
                     EF.Functions.Like((c.Personales.Ciudad ?? "").ToLower(), $"%{kw}%"))) ||
                c.Perfiles.Any(p => p.EsActivo && EF.Functions.Like((p.NombrePerfil ?? "").ToLower(), $"%{kw}%")) ||
                c.Habilidades.Any(h => EF.Functions.Like(h.Nombre.ToLower(), $"%{kw}%")));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(c => c.ContadorVisitas)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<IReadOnlyDictionary<int, bool>> GetCvPublicadoPorUsuarioIdsAsync(
        IReadOnlyCollection<int> usuarioIds,
        CancellationToken ct = default)
    {
        if (usuarioIds.Count == 0)
            return new Dictionary<int, bool>();

        var rows = await _dbSet.AsNoTracking()
            .Where(c => usuarioIds.Contains(c.UsuarioId))
            .Select(c => new { c.UsuarioId, c.Estado })
            .ToListAsync(ct);

        return rows.ToDictionary(
            r => r.UsuarioId,
            r => CurriculumEstados.EsPublicado(r.Estado));
    }
}
