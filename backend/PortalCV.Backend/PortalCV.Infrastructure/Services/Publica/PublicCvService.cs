using Microsoft.EntityFrameworkCore;
using PortalCV.Application.DTOs.Publica;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class PublicCvService : IPublicCvService
{
    private readonly ICurriculumRepository _curriculumRepo;
    private readonly IRepository<VisitanteContacto> _contactoRepo;
    private readonly IRepository<AlertaVisita> _alertaRepo;
    private readonly IRepository<EstadisticasPublicas> _estadisticasRepo;
    private readonly PortalCvDbContext _context;

    public PublicCvService(
        ICurriculumRepository curriculumRepo,
        IRepository<VisitanteContacto> contactoRepo,
        IRepository<AlertaVisita> alertaRepo,
        IRepository<EstadisticasPublicas> estadisticasRepo,
        PortalCvDbContext context)
    {
        _curriculumRepo = curriculumRepo;
        _contactoRepo = contactoRepo;
        _alertaRepo = alertaRepo;
        _estadisticasRepo = estadisticasRepo;
        _context = context;
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

        // Registrar visita
        await RegistrarVisitaAsync(cv, "Vista", ct);

        return MapToDetalle(cv);
    }

    public async Task<CvEstadisticasDto?> GetEstadisticasAsync(string urlPublica, CancellationToken ct = default)
    {
        var cv = await _context.Curriculums
            .AsNoTracking()
            .Include(c => c.EstadisticasPublicas)
            .FirstOrDefaultAsync(c => c.UrlPublica == urlPublica && c.Estado == "Publicado", ct);

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

    public async Task ContactarAsync(int curriculumId, ContactarCvRequest request, CancellationToken ct = default)
    {
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
        var cv = await _context.Curriculums.FindAsync(new object[] { curriculumId }, ct);
        if (cv is not null)
        {
            cv.ContadorContactos++;
            cv.FechaActualizacion = DateTime.UtcNow;
        }

        // Actualizar estadÃ­sticas
        await ActualizarEstadisticasAsync(curriculumId, esContacto: true, ct);

        await _context.SaveChangesAsync(ct);
    }

    // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private async Task RegistrarVisitaAsync(Curriculum cv, string tipo, CancellationToken ct)
    {
        var alerta = new AlertaVisita
        {
            CurriculumId = cv.CurriculumId,
            FechaVisita = DateTime.UtcNow,
            TipoVisita = tipo,
            EsLeida = false,
            Titulo = "Nueva visita a tu CV"
        };
        await _alertaRepo.AddAsync(alerta, ct);

        cv.ContadorVisitas++;
        cv.FechaActualizacion = DateTime.UtcNow;

        await ActualizarEstadisticasAsync(cv.CurriculumId, esContacto: false, ct);
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

    private static CvDetalleDto MapToDetalle(Curriculum c) => new(
        c.CurriculumId,
        c.UrlPublica,
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
            p.AspiracionSalarialPesos, p.AspiracionSalarialDolares)),
        c.Experiencias.Select(e => new ExperienciaPublicoDto(e.ExperienciaId, e.Empresa, e.Cargo,
            e.Sector, e.FechaInicio, e.FechaFin, e.EsActual, e.Funciones)),
        c.Formaciones.Select(f => new FormacionPublicoDto(f.FormacionId, f.Titulo, f.Institucion,
            f.Area, f.TipoFormacion, f.FechaInicio, f.FechaFin)),
        c.Habilidades.Select(h => new HabilidadPublicoDto(h.HabilidadId, h.Nombre, h.Tipo, h.Nivel,
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

