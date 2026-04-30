using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PortalCV.Application;
using PortalCV.Application.DTOs.Publica;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;
using PortalCV.Infrastructure.Helpers;

namespace PortalCV.Infrastructure.Services;

public class PublicCvService : IPublicCvService
{
    private readonly ICurriculumRepository _curriculumRepo;
    private readonly PortalCvDbContext _context;
    private readonly ILogger<PublicCvService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public PublicCvService(
        ICurriculumRepository curriculumRepo,
        PortalCvDbContext context,
        ILogger<PublicCvService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _curriculumRepo = curriculumRepo;
        _context = context;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task<(IReadOnlyList<CvListadoItemDto> Items, int Total)> BuscarCvsAsync(
        BuscarCvsQuery query, CancellationToken ct = default)
    {
        var (cvs, total) = await _curriculumRepo.BuscarPublicosAsync(
            query.Ciudad, query.Habilidad, query.PalabraClave, query.Page, query.PageSize, ct);

        var items = cvs.Select(c => new CvListadoItemDto(
            c.CurriculumId,
            c.UrlPublica,
            c.Personales is null ? null
                : $"{c.Personales.PrimerNombre} {c.Personales.PrimerApellido}".Trim(),
            c.Personales?.FotoUrl,
            c.Personales?.Ciudad,
            c.Personales?.Pais,
            c.Perfiles.FirstOrDefault()?.NombrePerfil,
            c.ContadorVisitas,
            c.ContadorContactos,
            c.Habilidades.Select(h => h.Nombre)
        )).ToList();

        return (items, total);
    }

    public async Task<CvDetalleDto?> GetDetalleAsync(string urlPublica, string? visitanteAnonimoId = null, CancellationToken ct = default)
    {
        var swTotal = Stopwatch.StartNew();
        var sw = Stopwatch.StartNew();
        var cv = await _curriculumRepo.GetByUrlPublicaAsync(urlPublica, ct);
        var msQuery = sw.ElapsedMilliseconds;
        if (cv is null) return null;

        EncolarRegistroVista(cv.CurriculumId, urlPublica, visitanteAnonimoId);

        var expVisibles = ExperienciasVisiblesOrdenadas(cv.Experiencias);
        var mesesAcum = ExperienciaLaboralAcumulada.CalcularMeses(
            expVisibles.Select(e => (e.FechaInicio, e.FechaFin, e.EsActual)));

        var dto = MapToDetalle(cv, mesesAcum, expVisibles);
        var totalMs = swTotal.ElapsedMilliseconds;

        _logger.LogDebug(
            "PublicCv.GetDetalle {UrlPublica}: queryMs={QueryMs}, totalMs={TotalMs} (visita en segundo plano)",
            urlPublica, msQuery, totalMs);

        if (totalMs >= 2000)
        {
            _logger.LogWarning(
                "PublicCv.GetDetalle lento {UrlPublica}: queryMs={QueryMs}, totalMs={TotalMs}",
                urlPublica, msQuery, totalMs);
        }

        return dto;
    }

    public async Task<PublicSnapshotItemDto?> TryBuildSnapshotItemDtoAsync(int curriculumId, CancellationToken ct = default)
    {
        var cv = await _curriculumRepo.GetByIdForSnapshotAsync(curriculumId, ct);
        if (cv is null) return null;

        var expVisibles = ExperienciasVisiblesOrdenadas(cv.Experiencias);
        var mesesAcum = ExperienciaLaboralAcumulada.CalcularMeses(
            expVisibles.Select(e => (e.FechaInicio, e.FechaFin, e.EsActual)));

        var nombrePerfil =
            cv.Perfiles.FirstOrDefault(p => p.EsActivo)?.NombrePerfil
            ?? cv.Perfiles.FirstOrDefault()?.NombrePerfil;

        var listado = new CvListadoItemDto(
            cv.CurriculumId,
            cv.UrlPublica,
            cv.Personales is null ? null
                : $"{cv.Personales.PrimerNombre} {cv.Personales.PrimerApellido}".Trim(),
            cv.Personales?.FotoUrl,
            cv.Personales?.Ciudad,
            cv.Personales?.Pais,
            nombrePerfil,
            cv.ContadorVisitas,
            cv.ContadorContactos,
            cv.Habilidades.Select(h => h.Nombre).ToList());

        var detalle = MapToDetalle(cv, mesesAcum, expVisibles);
        var stats = await GetEstadisticasAsync(cv.UrlPublica, ct);
        return new PublicSnapshotItemDto(listado, detalle, stats);
    }

    public async Task<CvEstadisticasDto?> GetEstadisticasAsync(string urlPublica, CancellationToken ct = default)
    {
        var cv = await _context.Curriculums
            .AsNoTracking()
            .Include(c => c.EstadisticasPublicas)
            .FirstOrDefaultAsync(c =>
                c.UrlPublica == urlPublica &&
                c.Estado == CurriculumEstados.Publicado &&
                c.Usuario.Estado == UsuarioEstados.Activo,
                ct);

        if (cv is null) return null;

        var stats = cv.EstadisticasPublicas;
        return new CvEstadisticasDto(
            cv.CurriculumId,
            cv.UrlPublica,
            stats?.TotalVisitas ?? cv.ContadorVisitas,
            stats?.TotalContactos ?? cv.ContadorContactos,
            stats?.UltimaVisita,
            stats?.FechaActualizacion ?? cv.FechaActualizacion);
    }

    public async Task<FiltrosPublicosDto> GetFiltrosAsync(CancellationToken ct = default)
    {
        var ciudades = await _context.Personales
            .AsNoTracking()
            .Where(p =>
                p.Ciudad != null &&
                p.Curriculum.Estado == CurriculumEstados.Publicado &&
                p.Curriculum.Usuario.Estado == UsuarioEstados.Activo)
            .Select(p => p.Ciudad!)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync(ct);

        var habilidades = await _context.Habilidades
            .AsNoTracking()
            .Where(h =>
                h.Curriculum.Estado == CurriculumEstados.Publicado &&
                h.Curriculum.Usuario.Estado == UsuarioEstados.Activo)
            .Select(h => h.Nombre)
            .Distinct()
            .OrderBy(h => h)
            .ToListAsync(ct);

        return new FiltrosPublicosDto(ciudades, habilidades);
    }

    public async Task ContactarAsync(string urlPublica, ContactarCvRequest request, CancellationToken ct = default)
    {
        var cv = await _curriculumRepo.GetByUrlPublicaAsync(urlPublica, ct)
            ?? throw new KeyNotFoundException($"CV '{urlPublica}' no encontrado.");
        var curriculumId = cv.CurriculumId;

        var ahora = DateTime.UtcNow;
        var contacto = new VisitanteContacto
        {
            CurriculumId = curriculumId,
            Nombre = request.Nombre,
            Correo = request.Correo ?? string.Empty,
            Empresa = request.Empresa,
            MotivoContacto = request.MotivoContacto,
            Asunto = request.Asunto,
            ComoMeEncontraste = request.ComoMeEncontraste,
            Mensaje = request.Mensaje,
            FechaContacto = ahora
        };

        var alerta = new AlertaVisita
        {
            CurriculumId = curriculumId,
            FechaVisita = ahora,
            TipoVisita = "Contacto",
            EsLeida = false,
            Titulo = $"Nuevo contacto de {request.Nombre ?? request.Correo}",
            Descripcion = request.Asunto ?? request.MotivoContacto,
            Origen = request.ComoMeEncontraste,
            VisitanteContacto = contacto
        };

        _context.AlertasVisita.Add(alerta);

        // Contadores y EstadisticasPublicas: triggers trg_*_SyncEstadisticas.
        await _context.SaveChangesAsync(ct);
    }

    public async Task RegistrarImpresionPdfAsync(string urlPublica, string? visitanteAnonimoId = null, CancellationToken ct = default)
    {
        var cv = await _curriculumRepo.GetByUrlPublicaAsync(urlPublica, ct)
            ?? throw new KeyNotFoundException($"CV '{urlPublica}' no encontrado.");

        var curriculumId = cv.CurriculumId;

        if (string.IsNullOrWhiteSpace(visitanteAnonimoId))
            return;

        var vid = visitanteAnonimoId.Trim();
        if (vid.Length > 36 || !Guid.TryParse(vid, out _))
            return;

        var existing = await _context.AlertasVisita
            .FirstOrDefaultAsync(a =>
                a.CurriculumId == curriculumId &&
                a.TipoVisita == "Descarga" &&
                a.VisitanteAnonimoId == vid, ct);

        if (existing is null)
        {
            await _context.AlertasVisita.AddAsync(new AlertaVisita
            {
                CurriculumId = curriculumId,
                FechaVisita = DateTime.UtcNow,
                TipoVisita = "Descarga",
                VisitanteAnonimoId = vid,
                VistasAcumuladas = 1,
                EsLeida = false,
                Titulo = "Impresión o guardado en PDF",
                Descripcion = "Impreso o PDF 1 vez"
            }, ct);
        }
        else
        {
            existing.FechaVisita = DateTime.UtcNow;
            existing.VistasAcumuladas++;
            existing.Descripcion = existing.VistasAcumuladas == 1
                ? "Impreso o PDF 1 vez"
                : $"Impreso o PDF {existing.VistasAcumuladas} veces";
            existing.Titulo = "Impresión o guardado en PDF";
            existing.EsLeida = false;
        }

        await _context.SaveChangesAsync(ct);
    }

    /// <summary>
    /// No bloquea la respuesta HTTP: nuevo scope + DbContext para persistir visita tras devolver el detalle.
    /// </summary>
    private void EncolarRegistroVista(int curriculumId, string urlPublica, string? visitanteAnonimoId)
    {
        _ = RegistrarVistaEnSegundoPlanoAsync(curriculumId, urlPublica, visitanteAnonimoId);
    }

    private async Task RegistrarVistaEnSegundoPlanoAsync(int curriculumId, string urlPublica, string? visitanteAnonimoId)
    {
        await Task.Yield();
        try
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var registro = scope.ServiceProvider.GetRequiredService<IPublicCvVisitaRegistroService>();
            await registro.RegistrarVistaAsync(curriculumId, visitanteAnonimoId, CancellationToken.None);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo registrar la visita al CV público {UrlPublica}", urlPublica);
        }
    }

    /// <summary>BD puede tener 'Basico'; el sitio público muestra 'Básico'.</summary>
    private static string? MapHabilidadNivelPublico(string? nivel)
    {
        if (string.IsNullOrWhiteSpace(nivel)) return null;
        var t = nivel.Trim();
        return string.Equals(t, "Basico", StringComparison.Ordinal) ? "Básico" : t;
    }

    private const string VisDashboardPublico = "dashboard.publico";
    private const string VisDashboardMetricas = "dashboard.metricas";
    private const string VisDashboardGraficas = "dashboard.graficas";
    private const string VisPersonalesEmail = "datos-personales.email";
    private const string VisPersonalesTelefono = "datos-personales.telefono";

    /// <summary>Visibilidad fina (VisibilidadSeccion). Sin fila = visible por defecto.</summary>
    private static bool VisibilidadAtributoVisible(IEnumerable<VisibilidadSeccion>? vis, string nombreSeccion, bool defaultVisible = true)
    {
        if (vis is null) return defaultVisible;
        var row = vis.FirstOrDefault(v => string.Equals(v.NombreSeccion, nombreSeccion, StringComparison.Ordinal));
        return row?.EsVisible ?? defaultVisible;
    }

    /// <summary>Empleos incluidos en Mi CV / público; orden: actual primero, luego más reciente por fechas.</summary>
    private static List<Experiencia> ExperienciasVisiblesOrdenadas(IEnumerable<Experiencia> experiencias)
    {
        return experiencias
            .Where(e => e.MostrarEnCv)
            .OrderByDescending(e => e.EsActual)
            .ThenByDescending(e => e.FechaInicio ?? DateOnly.MinValue)
            .ThenByDescending(e => e.FechaFin ?? DateOnly.MinValue)
            .ToList();
    }

    private static (bool Activo, bool Metricas, bool Graficas) ResolverFlagsDashboardPublico(Curriculum c)
    {
        var vis = c.VisibilidadesSeccion ?? Array.Empty<VisibilidadSeccion>();
        bool? master = vis.FirstOrDefault(v => v.NombreSeccion == VisDashboardPublico)?.EsVisible;
        bool? met = vis.FirstOrDefault(v => v.NombreSeccion == VisDashboardMetricas)?.EsVisible;
        bool? graf = vis.FirstOrDefault(v => v.NombreSeccion == VisDashboardGraficas)?.EsVisible;

        var m = master ?? true;
        var me = met ?? true;
        var g = graf ?? true;
        return (m, m && me, m && g);
    }

    private static CvDetalleDto MapToDetalle(
        Curriculum c,
        int experienciaLaboralMesesAcumulados,
        IReadOnlyList<Experiencia> experienciasVisibles)
    {
        var plantilla = CvPlantillaCodigos.NormalizeOrDefault(c.PlantillaCodigo);
        var dash = ResolverFlagsDashboardPublico(c);
        var vis = c.VisibilidadesSeccion;
        var mostrarEmail = VisibilidadAtributoVisible(vis, VisPersonalesEmail);
        var mostrarTelefono = VisibilidadAtributoVisible(vis, VisPersonalesTelefono);
        var idsExpVisibles = experienciasVisibles.Select(e => e.ExperienciaId).ToHashSet();
        return new CvDetalleDto(
        c.CurriculumId,
        c.UrlPublica,
        plantilla,
        experienciaLaboralMesesAcumulados,
        c.Personales is null ? null : new PersonalesPublicoDto(
            string.IsNullOrWhiteSpace($"{c.Personales.PrimerNombre} {c.Personales.PrimerApellido}".Trim())
                ? null
                : $"{c.Personales.PrimerNombre} {c.Personales.PrimerApellido}".Trim(),
            c.Personales.FotoUrl,
            c.Personales.Ciudad,
            c.Personales.Pais,
            mostrarTelefono ? c.Personales.Celular : null,
            mostrarEmail ? c.Personales.Email : null),
        c.Perfiles.Select(p => new PerfilPublicoDto(p.PerfilId, p.NombrePerfil, p.DescripcionPerfil,
            p.AspiracionSalarialPesos, p.AspiracionSalarialDolares, p.EsActivo)),
        experienciasVisibles.Select(e => new ExperienciaPublicoDto(e.ExperienciaId, e.Empresa, e.Cargo,
            e.Sector, e.FechaInicio, e.FechaFin, e.EsActual, e.Funciones, e.TipoContrato)),
        c.Formaciones.Select(f => new FormacionPublicoDto(f.FormacionId, f.Titulo, f.Institucion,
            f.Area, f.TipoFormacion, f.FechaInicio, f.FechaFin)),
        c.Habilidades.Select(h => new HabilidadPublicoDto(h.HabilidadId, h.Nombre, h.Tipo, MapHabilidadNivelPublico(h.Nivel), h.Descripcion,
            h.NivelLectura, h.NivelEscritura, h.NivelEscucha, h.NivelHabla)),
        c.Proyectos.Select(p => new ProyectoPublicoDto(p.ProyectoId, p.NombreProyecto, p.Rol,
            p.StackTecnologico, p.Aporte, p.Logro, p.EquipoTamano, p.DuracionMeses)),
        c.Referencias.Where(r => r.TipoReferencia == "Laboral"
            && (r.ExperienciaId is null || idsExpVisibles.Contains(r.ExperienciaId.Value)))
            .Select(r => new ReferenciaPublicoDto(r.ReferenciaId, r.TipoReferencia, r.Nombre,
                r.Apellido, r.Cargo, r.Empresa)),
        c.RedesSociales.Select(r => new RedSocialPublicoDto(r.RedSocialId, r.NombreRed,
            r.LinkPublico, r.UsuarioContacto)),
        dash.Activo,
        dash.Metricas,
        dash.Graficas
    );
    }
}

