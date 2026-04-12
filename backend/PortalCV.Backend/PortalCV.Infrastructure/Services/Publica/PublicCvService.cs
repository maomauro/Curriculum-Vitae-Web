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
    private readonly IRepository<VisitanteContacto> _contactoRepo;
    private readonly IRepository<AlertaVisita> _alertaRepo;
    private readonly PortalCvDbContext _context;
    private readonly ILogger<PublicCvService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public PublicCvService(
        ICurriculumRepository curriculumRepo,
        IRepository<VisitanteContacto> contactoRepo,
        IRepository<AlertaVisita> alertaRepo,
        PortalCvDbContext context,
        ILogger<PublicCvService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _curriculumRepo = curriculumRepo;
        _contactoRepo = contactoRepo;
        _alertaRepo = alertaRepo;
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

    public async Task<CvDetalleDto?> GetDetalleAsync(string urlPublica, CancellationToken ct = default)
    {
        var swTotal = Stopwatch.StartNew();
        var sw = Stopwatch.StartNew();
        var cv = await _curriculumRepo.GetByUrlPublicaAsync(urlPublica, ct);
        var msQuery = sw.ElapsedMilliseconds;
        if (cv is null) return null;

        EncolarRegistroVista(cv.CurriculumId, urlPublica);

        var mesesAcum = ExperienciaLaboralAcumulada.CalcularMeses(
            cv.Experiencias.Select(e => (e.FechaInicio, e.FechaFin, e.EsActual)));

        var dto = MapToDetalle(cv, mesesAcum);
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

    public async Task<CvEstadisticasDto?> GetEstadisticasAsync(string urlPublica, CancellationToken ct = default)
    {
        var cv = await _context.Curriculums
            .AsNoTracking()
            .Include(c => c.EstadisticasPublicas)
            .FirstOrDefaultAsync(c => c.UrlPublica == urlPublica && c.Estado == CurriculumEstados.Publicado, ct);

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
            .Where(p => p.Ciudad != null)
            .Select(p => p.Ciudad!)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync(ct);

        var habilidades = await _context.Habilidades
            .AsNoTracking()
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
            FechaContacto = DateTime.UtcNow
        };
        await _contactoRepo.AddAsync(contacto, ct);

        var alerta = new AlertaVisita
        {
            CurriculumId = curriculumId,
            FechaVisita = DateTime.UtcNow,
            TipoVisita = "Contacto",
            EsLeida = false,
            Titulo = $"Nuevo contacto de {request.Nombre ?? request.Correo}",
            Descripcion = request.Asunto ?? request.MotivoContacto,
            Origen = request.ComoMeEncontraste
        };
        await _alertaRepo.AddAsync(alerta, ct);

        // Actualizar contador en Curriculum
        var curriculum = await _context.Curriculums.FindAsync(new object[] { curriculumId }, ct);
        if (curriculum is not null)
        {
            curriculum.ContadorContactos++;
            curriculum.FechaActualizacion = DateTime.UtcNow;
        }

        // Actualizar estadÃ­sticas
        await EstadisticasPublicasUpdater.ActualizarAsync(_context, curriculumId, esContacto: true, ct);

        await _context.SaveChangesAsync(ct);
    }

    /// <summary>
    /// No bloquea la respuesta HTTP: nuevo scope + DbContext para persistir visita tras devolver el detalle.
    /// </summary>
    private void EncolarRegistroVista(int curriculumId, string urlPublica)
    {
        _ = RegistrarVistaEnSegundoPlanoAsync(curriculumId, urlPublica);
    }

    private async Task RegistrarVistaEnSegundoPlanoAsync(int curriculumId, string urlPublica)
    {
        await Task.Yield();
        try
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var registro = scope.ServiceProvider.GetRequiredService<IPublicCvVisitaRegistroService>();
            await registro.RegistrarVistaAsync(curriculumId, CancellationToken.None);
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

    private static CvDetalleDto MapToDetalle(Curriculum c, int experienciaLaboralMesesAcumulados)
    {
        var plantilla = CvPlantillaCodigos.NormalizeOrDefault(c.PlantillaCodigo);
        var dash = ResolverFlagsDashboardPublico(c);
        var vis = c.VisibilidadesSeccion;
        var mostrarEmail = VisibilidadAtributoVisible(vis, VisPersonalesEmail);
        var mostrarTelefono = VisibilidadAtributoVisible(vis, VisPersonalesTelefono);
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
        c.Experiencias.Select(e => new ExperienciaPublicoDto(e.ExperienciaId, e.Empresa, e.Cargo,
            e.Sector, e.FechaInicio, e.FechaFin, e.EsActual, e.Funciones, e.TipoContrato)),
        c.Formaciones.Select(f => new FormacionPublicoDto(f.FormacionId, f.Titulo, f.Institucion,
            f.Area, f.TipoFormacion, f.FechaInicio, f.FechaFin)),
        c.Habilidades.Select(h => new HabilidadPublicoDto(h.HabilidadId, h.Nombre, h.Tipo, MapHabilidadNivelPublico(h.Nivel), h.Descripcion,
            h.NivelLectura, h.NivelEscritura, h.NivelEscucha, h.NivelHabla)),
        c.Proyectos.Select(p => new ProyectoPublicoDto(p.ProyectoId, p.NombreProyecto, p.Rol,
            p.StackTecnologico, p.Aporte, p.Logro, p.EquipoTamano, p.DuracionMeses)),
        c.Referencias.Where(r => r.TipoReferencia == "Laboral")
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

