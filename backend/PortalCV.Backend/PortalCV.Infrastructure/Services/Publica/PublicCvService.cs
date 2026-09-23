using System.Diagnostics;
using System.Net.Mail;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PortalCV.Application;
using PortalCV.Application.DTOs.Privada;
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
            VisibilidadAtributoVisible(c.VisibilidadesSeccion, VisPersonalesFoto)
                ? ResolverFotoUrlPublica(c.Personales, c.UrlPublica)
                : null,
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
        var cv = await _curriculumRepo.GetByUrlPublicaSinAdjuntosAsync(urlPublica, ct);
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

    public async Task<ArchivoContenidoDto?> GetFotoPersonalesPublicaAsync(string urlPublica, CancellationToken ct = default)
    {
        var cv = await _curriculumRepo.GetByUrlPublicaAsync(urlPublica, ct);
        if (cv?.Personales?.FotoBytes is null || cv.Personales.FotoContentType is null) return null;
        if (!VisibilidadAtributoVisible(cv.VisibilidadesSeccion, VisPersonalesFoto)) return null;

        return new ArchivoContenidoDto(cv.Personales.FotoBytes, cv.Personales.FotoContentType);
    }

    public async Task<ArchivoContenidoDto?> GetAdjuntoExperienciaPublicaAsync(
        string urlPublica, int experienciaId, CancellationToken ct = default)
    {
        var cv = await _curriculumRepo.GetByUrlPublicaAsync(urlPublica, ct);
        var e = cv?.Experiencias.FirstOrDefault(x => x.ExperienciaId == experienciaId);
        if (e is null || !e.MostrarEnCv || e.AdjuntoSoporteBytes is null || e.AdjuntoSoporteContentType is null)
            return null;
        if (!VisibilidadAtributoVisible(cv!.VisibilidadesSeccion, VisExperienciaSoporte)) return null;

        return new ArchivoContenidoDto(e.AdjuntoSoporteBytes, e.AdjuntoSoporteContentType);
    }

    public async Task<ArchivoContenidoDto?> GetAdjuntoFormacionPublicaAsync(
        string urlPublica, int formacionId, CancellationToken ct = default)
    {
        var cv = await _curriculumRepo.GetByUrlPublicaAsync(urlPublica, ct);
        var f = cv?.Formaciones.FirstOrDefault(x => x.FormacionId == formacionId);
        if (f is null || !f.MostrarEnCv || f.AdjuntoSoporteBytes is null || f.AdjuntoSoporteContentType is null)
            return null;
        if (!VisibleDescargarSoporteFormacion(cv!.VisibilidadesSeccion, f.TipoFormacion)) return null;

        return new ArchivoContenidoDto(f.AdjuntoSoporteBytes, f.AdjuntoSoporteContentType);
    }

    public async Task<CvDetalleDto?> GetPreviewPrivadoAsync(int curriculumId, CancellationToken ct = default)
    {
        var cv = await _curriculumRepo.GetParaPreviewPublicoPorIdSinAdjuntosAsync(curriculumId, ct);
        if (cv is null) return null;

        var expVisibles = ExperienciasVisiblesOrdenadas(cv.Experiencias);
        var mesesAcum = ExperienciaLaboralAcumulada.CalcularMeses(
            expVisibles.Select(e => (e.FechaInicio, e.FechaFin, e.EsActual)));

        return MapToDetalle(cv, mesesAcum, expVisibles);
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
        ValidarContactoRequest(request);

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

    /// <summary>Valida formato/longitud antes de tocar la BD -- sin esto, un correo mal
    /// formado o un campo demasiado largo llegaba intacto hasta el INSERT y fallaba con
    /// un 500 genérico (MaxLength de columna) en vez de un 400 con mensaje claro.</summary>
    private static void ValidarContactoRequest(ContactarCvRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Correo))
            throw new ArgumentException("El correo de contacto es obligatorio.");

        try
        {
            _ = new MailAddress(request.Correo);
        }
        catch (FormatException)
        {
            throw new ArgumentException("El correo de contacto no tiene un formato válido.");
        }

        if (request.Correo.Length > 150)
            throw new ArgumentException("El correo de contacto no puede superar 150 caracteres.");
        if (request.Nombre?.Length > 100)
            throw new ArgumentException("El nombre no puede superar 100 caracteres.");
        if (request.Empresa?.Length > 150)
            throw new ArgumentException("La empresa no puede superar 150 caracteres.");
        if (request.MotivoContacto?.Length > 100)
            throw new ArgumentException("El motivo de contacto no puede superar 100 caracteres.");
        if (request.Asunto?.Length > 200)
            throw new ArgumentException("El asunto no puede superar 200 caracteres.");
        if (request.ComoMeEncontraste?.Length > 100)
            throw new ArgumentException("El campo \"cómo me encontraste\" no puede superar 100 caracteres.");
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

    private static readonly JsonSerializerOptions JsonOpcionesWeb = new(JsonSerializerDefaults.Web);

    private const string VisDashboardPublico = "dashboard.publico";
    private const string VisDashboardMetricas = "dashboard.metricas";
    private const string VisDashboardGraficas = "dashboard.graficas";
    private const string VisProfesionalPublico = "profesional.publico";
    private const string VisHojaDeVidaPublico = "hoja-de-vida.publico";
    private const string VisPersonalesEmail = "datos-personales.email";
    private const string VisPersonalesTelefono = "datos-personales.telefono";
    private const string VisPersonalesFoto = "datos-personales.foto";
    private const string VisPersonalesCiudadPais = "datos-personales.ciudad-pais";
    private const string VisExperienciaSoporte = "experiencia.soporte-certificacion-laboral";
    private const string VisEducacion = "educacion";

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

    /// <summary>URL efectiva de la foto: el endpoint binario si hay una subida, o la URL
    /// legacy pegada por el usuario si no.</summary>
    private static string? ResolverFotoUrlPublica(Personales? personales, string urlPublica) =>
        personales is null ? null
        : personales.FotoBytes is not null ? $"/api/public/cvs/{urlPublica}/foto"
        : personales.FotoUrl;

    private static string? ResolverAdjuntoUrlExperienciaPublica(Experiencia e, string urlPublica) =>
        e.AdjuntoSoporteBytes is not null
            ? $"/api/public/cvs/{urlPublica}/experiencias/{e.ExperienciaId}/adjunto"
            : e.AdjuntoSoporte;

    private static string? ResolverAdjuntoUrlFormacionPublica(Formacion f, string urlPublica) =>
        f.AdjuntoSoporteBytes is not null
            ? $"/api/public/cvs/{urlPublica}/formaciones/{f.FormacionId}/adjunto"
            : f.AdjuntoSoporte;

    /// <summary>Mismo criterio de clasificación que usa el frontend para agrupar Formacion en
    /// bloques de la vista previa (cv-plantilla-preview.component.ts: formacionesDiplomado/
    /// formacionesCertificacion/formacionesCurso; el resto cae en formación académica).</summary>
    private static string BloqueFormacion(string? tipoFormacion) => (tipoFormacion ?? string.Empty).Trim() switch
    {
        "Diplomado" => "diplomados",
        "Certificacion" => "certificaciones",
        "Curso" => "cursos",
        _ => "formacion-academica",
    };

    /// <summary>Mismo criterio que VisibilidadSeccionResolver.visibleBloqueFormacion en el
    /// frontend: "formacion-academica" siempre visible; los demás bloques usan su propia fila
    /// si existe, o heredan del interruptor general "educacion" si no.</summary>
    private static bool VisibleBloqueFormacion(IEnumerable<VisibilidadSeccion>? vis, string bloque)
    {
        if (bloque == "formacion-academica") return true;
        var visList = vis ?? Array.Empty<VisibilidadSeccion>();
        return visList.Any(v => v.NombreSeccion == bloque)
            ? VisibilidadAtributoVisible(visList, bloque)
            : VisibilidadAtributoVisible(visList, VisEducacion);
    }

    /// <summary>Mismo criterio que VisibilidadSeccionResolver.visibleDescargarSoporte en el
    /// frontend (ver visibilidad-seccion-resolver.ts).</summary>
    private static bool VisibleDescargarSoporteFormacion(IEnumerable<VisibilidadSeccion>? vis, string? tipoFormacion)
    {
        var bloque = BloqueFormacion(tipoFormacion);
        if (!VisibleBloqueFormacion(vis, bloque)) return false;
        var attr = bloque == "formacion-academica" ? "descargar-soporte" : "descargar-soporte-certificado";
        return VisibilidadAtributoVisible(vis, $"{bloque}.{attr}");
    }

    /// <summary>Interruptor maestro de la pestaña "Información profesional" en el CV público
    /// (VisibilidadSeccion <c>profesional.publico</c>). Sin fila = visible por defecto.</summary>
    private static bool ResolverFlagProfesionalPublico(Curriculum c)
    {
        var vis = c.VisibilidadesSeccion ?? Array.Empty<VisibilidadSeccion>();
        return vis.FirstOrDefault(v => v.NombreSeccion == VisProfesionalPublico)?.EsVisible ?? true;
    }

    /// <summary>Interruptor maestro de la pestaña "Hoja de vida" en el CV público
    /// (VisibilidadSeccion <c>hoja-de-vida.publico</c>). Sin fila = visible por defecto.</summary>
    private static bool ResolverFlagHojaDeVidaPublico(Curriculum c)
    {
        var vis = c.VisibilidadesSeccion ?? Array.Empty<VisibilidadSeccion>();
        return vis.FirstOrDefault(v => v.NombreSeccion == VisHojaDeVidaPublico)?.EsVisible ?? true;
    }

    /// <summary>Contenido de la Hoja de Vida pública: el CvGenerado del Perfil que el
    /// candidato marcó como activo (Perfil.EsActivo) -- null si no hay Perfil activo o el
    /// activo todavía no tiene un CV generado.</summary>
    private static ContenidoCvGeneradoDto? ResolverHojaDeVidaContenido(Curriculum c)
    {
        var perfilActivo = c.Perfiles?.FirstOrDefault(p => p.EsActivo);
        var contenidoJson = perfilActivo?.CvGenerado?.ContenidoJson;
        if (string.IsNullOrWhiteSpace(contenidoJson)) return null;

        return JsonSerializer.Deserialize<ContenidoCvGeneradoDto>(contenidoJson, JsonOpcionesWeb);
    }

    private static CvDetalleDto MapToDetalle(
        Curriculum c,
        int experienciaLaboralMesesAcumulados,
        IReadOnlyList<Experiencia> experienciasVisibles)
    {
        var plantilla = CvPlantillaCodigos.NormalizeOrDefault(c.PlantillaCodigo);
        var dash = ResolverFlagsDashboardPublico(c);
        var profesionalPublico = ResolverFlagProfesionalPublico(c);
        var hojaDeVidaPublico = ResolverFlagHojaDeVidaPublico(c);
        var hojaDeVidaContenido = ResolverHojaDeVidaContenido(c);
        var vis = c.VisibilidadesSeccion;
        var mostrarEmail = VisibilidadAtributoVisible(vis, VisPersonalesEmail);
        var mostrarTelefono = VisibilidadAtributoVisible(vis, VisPersonalesTelefono);
        var mostrarFoto = VisibilidadAtributoVisible(vis, VisPersonalesFoto);
        var mostrarCiudadPais = VisibilidadAtributoVisible(vis, VisPersonalesCiudadPais);
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
            mostrarFoto ? ResolverFotoUrlPublica(c.Personales, c.UrlPublica) : null,
            mostrarCiudadPais ? c.Personales.Ciudad : null,
            mostrarCiudadPais ? c.Personales.Pais : null,
            mostrarTelefono ? c.Personales.Celular : null,
            mostrarEmail ? c.Personales.Email : null),
        c.Perfiles.Select(p => new PerfilPublicoDto(p.PerfilId, p.NombrePerfil, p.DescripcionPerfil,
            p.MostrarExperienciaPerfil ? p.ExperienciaPerfilAnios : null,
            p.MostrarAspiracionSalarial ? p.AspiracionSalarialPesos : null,
            p.MostrarAspiracionSalarial ? p.AspiracionSalarialDolares : null,
            p.EsActivo)),
        experienciasVisibles.Select(e => new ExperienciaPublicoDto(e.ExperienciaId, e.Empresa, e.Cargo,
            e.Sector, e.FechaInicio, e.FechaFin, e.EsActual, e.Funciones, e.TipoContrato,
            VisibilidadAtributoVisible(vis, VisExperienciaSoporte) ? ResolverAdjuntoUrlExperienciaPublica(e, c.UrlPublica) : null)),
        c.Formaciones.Where(f => f.MostrarEnCv).Select(f => new FormacionPublicoDto(f.FormacionId, f.Titulo, f.Institucion,
            f.Area, f.TipoFormacion, f.FechaInicio, f.FechaFin,
            VisibleDescargarSoporteFormacion(vis, f.TipoFormacion) ? ResolverAdjuntoUrlFormacionPublica(f, c.UrlPublica) : null)),
        c.Habilidades.Where(h => h.MostrarEnCv).Select(h => new HabilidadPublicoDto(h.HabilidadId, h.Nombre, h.Tipo, MapHabilidadNivelPublico(h.Nivel), h.Descripcion,
            h.NivelLectura, h.NivelEscritura, h.NivelEscucha, h.NivelHabla)),
        c.Proyectos.Where(p => p.MostrarEnCv).Select(p => new ProyectoPublicoDto(p.ProyectoId, p.NombreProyecto, p.Rol,
            p.StackTecnologico, p.Aporte, p.Logro, p.EquipoTamano, p.DuracionMeses)),
        c.Referencias.Where(r => r.TipoReferencia == "Laboral" && r.MostrarEnCv
            && (r.ExperienciaId is null || idsExpVisibles.Contains(r.ExperienciaId.Value)))
            .Select(r => new ReferenciaPublicoDto(r.ReferenciaId, r.TipoReferencia, r.Nombre,
                r.Apellido, r.Cargo, r.Empresa)),
        c.RedesSociales.Where(r => r.MostrarEnCv).Select(r => new RedSocialPublicoDto(r.RedSocialId, r.NombreRed,
            r.LinkPublico, r.UsuarioContacto)),
        dash.Activo,
        dash.Metricas,
        dash.Graficas,
        profesionalPublico,
        hojaDeVidaPublico,
        hojaDeVidaContenido,
        (vis ?? Array.Empty<VisibilidadSeccion>())
            .Select(v => new VisibilidadSeccionPublicaDto(v.NombreSeccion, v.EsVisible))
    );
    }
}

