using Microsoft.EntityFrameworkCore;
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
    private readonly IRepository<EstadisticasPublicas> _estadisticasRepo;
    private readonly PortalCvDbContext _context;
    private readonly ILogger<PublicCvService> _logger;

    public PublicCvService(
        ICurriculumRepository curriculumRepo,
        IRepository<VisitanteContacto> contactoRepo,
        IRepository<AlertaVisita> alertaRepo,
        IRepository<EstadisticasPublicas> estadisticasRepo,
        PortalCvDbContext context,
        ILogger<PublicCvService> logger)
    {
        _curriculumRepo = curriculumRepo;
        _contactoRepo = contactoRepo;
        _alertaRepo = alertaRepo;
        _estadisticasRepo = estadisticasRepo;
        _context = context;
        _logger = logger;
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
        var cv = await _curriculumRepo.GetByUrlPublicaAsync(urlPublica, ct);
        if (cv is null) return null;

        try
        {
            await RegistrarVisitaAsync(cv.CurriculumId, "Vista", ct);
        }
        catch (Exception ex)
        {
            // No bloquear la lectura del CV si falla alerta/estadísticas (p. ej. CHECK en BD desactualizado).
            _logger.LogWarning(ex, "No se pudo registrar la visita al CV público {UrlPublica}", urlPublica);
        }

        var mesesAcum = ExperienciaLaboralAcumulada.CalcularMeses(
            cv.Experiencias.Select(e => (e.FechaInicio, e.FechaFin, e.EsActual)));

        return MapToDetalle(cv, mesesAcum);
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
            Correo = request.Correo,
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
        await ActualizarEstadisticasAsync(curriculumId, esContacto: true, ct);

        await _context.SaveChangesAsync(ct);
    }

    // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// <summary>
    /// Igual que en <see cref="ContactarAsync"/>: el curriculum viene del repo con AsNoTracking;
    /// hay que cargar la fila en el contexto actual para persistir contadores.
    /// </summary>
    private async Task RegistrarVisitaAsync(int curriculumId, string tipo, CancellationToken ct)
    {
        var alerta = new AlertaVisita
        {
            CurriculumId = curriculumId,
            FechaVisita = DateTime.UtcNow,
            TipoVisita = tipo,
            EsLeida = false,
            Titulo = "Nueva visita a tu CV"
        };
        await _alertaRepo.AddAsync(alerta, ct);

        var curriculum = await _context.Curriculums.FindAsync(new object[] { curriculumId }, ct);
        if (curriculum is not null)
        {
            curriculum.ContadorVisitas++;
            curriculum.FechaActualizacion = DateTime.UtcNow;
        }

        await ActualizarEstadisticasAsync(curriculumId, esContacto: false, ct);
        await _context.SaveChangesAsync(ct);
    }

    private async Task ActualizarEstadisticasAsync(int curriculumId, bool esContacto, CancellationToken ct)
    {
        var stats = await _context.EstadisticasPublicas
            .FirstOrDefaultAsync(e => e.CurriculumId == curriculumId, ct);

        if (stats is null)
        {
            stats = new EstadisticasPublicas
            {
                CurriculumId = curriculumId,
                TotalVisitas = esContacto ? 0 : 1,
                TotalContactos = esContacto ? 1 : 0,
                UltimaVisita = esContacto ? null : DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            };
            await _context.EstadisticasPublicas.AddAsync(stats, ct);
        }
        else
        {
            if (esContacto) stats.TotalContactos++;
            else
            {
                stats.TotalVisitas++;
                stats.UltimaVisita = DateTime.UtcNow;
            }
            stats.FechaActualizacion = DateTime.UtcNow;
        }
    }

    /// <summary>BD puede tener 'Basico'; el sitio público muestra 'Básico'.</summary>
    private static string? MapHabilidadNivelPublico(string? nivel)
    {
        if (string.IsNullOrWhiteSpace(nivel)) return null;
        var t = nivel.Trim();
        return string.Equals(t, "Basico", StringComparison.Ordinal) ? "Básico" : t;
    }

    private static CvDetalleDto MapToDetalle(Curriculum c, int experienciaLaboralMesesAcumulados)
    {
        var plantilla = CvPlantillaCodigos.NormalizeOrDefault(c.PlantillaCodigo);
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
            c.Personales.PrivacidadTelefono == "Oculto" ? null : c.Personales.Celular,
            c.Personales.PrivacidadEmail == "Oculto" ? null : c.Personales.Email,
            c.Personales.PrivacidadEmail,
            c.Personales.PrivacidadTelefono),
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
            r.LinkPublico, r.UsuarioContacto))
    );
    }
}

