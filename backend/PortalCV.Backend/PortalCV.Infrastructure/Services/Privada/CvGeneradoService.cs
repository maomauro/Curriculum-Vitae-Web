using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using PortalCV.Application.Constants;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Exceptions;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class CvGeneradoService : ICvGeneradoService
{
    private const string CodigoPromptGenerador = "GENERADOR_CV_PERFIL";
    private static readonly JsonSerializerOptions JsonOpciones = new(JsonSerializerDefaults.Web);

    private readonly PortalCvDbContext _context;
    private readonly IIaPromptInvoker _invoker;
    private readonly ICvAuditoriaService _auditoriaCv;
    private readonly IHttpContextAccessor _http;

    public CvGeneradoService(
        PortalCvDbContext context, IIaPromptInvoker invoker, ICvAuditoriaService auditoriaCv, IHttpContextAccessor http)
    {
        _context = context;
        _invoker = invoker;
        _auditoriaCv = auditoriaCv;
        _http = http;
    }

    public async Task<IReadOnlyList<CvGeneradoDto>> ListarAsync(int curriculumId, CancellationToken ct = default)
    {
        var rows = await _context.CvsGenerados.AsNoTracking()
            .Include(c => c.Perfil)
            .Where(c => c.CurriculumId == curriculumId)
            .OrderByDescending(c => c.FechaGeneracion)
            .ToListAsync(ct);

        return rows.Select(Map).ToList();
    }

    /// <summary>La IA condensa experiencia/formación/proyectos/habilidades para que el
    /// CV quepa en máximo 3 hojas -- el front lo muestra con la misma apariencia visual
    /// (colores, tipografía, foto y encabezado) que "Profesional", pero como bloques de
    /// texto, no como tarjetas estructuradas. El resumen/descripción del Perfil no lo
    /// toca la IA (se muestra tal cual está guardado), y los datos de contacto/foto
    /// siguen viniendo directo de Personales.</summary>
    public async Task<CvGeneradoDto> GenerarAsync(int curriculumId, int perfilId, CancellationToken ct = default)
    {
        var perfil = await _context.Perfiles.FirstOrDefaultAsync(p => p.PerfilId == perfilId, ct)
            ?? throw new KeyNotFoundException($"Perfil {perfilId} no encontrado.");
        if (perfil.CurriculumId != curriculumId)
            throw new ForbiddenOperationException($"Perfil {perfilId} no pertenece al curriculum {curriculumId}.");

        var curriculumJson = await ArmarCurriculumJsonAsync(curriculumId, ct);
        var tiposPorHabilidad = await ObtenerTiposHabilidadAsync(curriculumId, ct);
        var perfilJson = JsonSerializer.Serialize(
            new { perfil.NombrePerfil, perfil.DescripcionPerfil, perfil.ExperienciaPerfilAnios }, JsonOpciones);

        var valores = new Dictionary<string, string>
        {
            ["PERFIL_JSON"] = perfilJson,
            ["CURRICULUM_JSON"] = curriculumJson,
        };

        var (textoRespuesta, promptPorDefecto) = await _invoker.InvocarAsync(
            curriculumId, CodigoPromptGenerador, PromptsPorDefecto.GeneradorCvPerfil, valores, ct: ct);

        var generado = RespuestaIaJsonParser.Parsear<CvPerfilGeneradoJson>(textoRespuesta);
        var experiencia = (generado.Experiencia ?? new List<ExperienciaCondensadaJson>())
            .Select(e => new ExperienciaCondensadaDto(
                e.Cabecera ?? string.Empty, e.Funciones ?? new List<string>()))
            .ToList();
        var habilidades = (generado.Habilidades ?? new List<string>())
            .Select(nombre => new HabilidadCondensadaDto(
                nombre, tiposPorHabilidad.GetValueOrDefault(nombre.Trim())))
            .ToList();
        var contenido = new ContenidoCvGeneradoDto(
            experiencia,
            generado.Educacion ?? new List<string>(),
            generado.Proyectos ?? new List<string>(),
            habilidades);
        var contenidoJson = JsonSerializer.Serialize(contenido, JsonOpciones);

        var existente = await _context.CvsGenerados.FirstOrDefaultAsync(c => c.PerfilId == perfilId, ct);
        if (existente is null)
        {
            existente = new CvGenerado { CurriculumId = curriculumId, PerfilId = perfilId };
            _context.CvsGenerados.Add(existente);
        }
        existente.ContenidoJson = contenidoJson;
        existente.PromptPorDefecto = promptPorDefecto;
        existente.FechaGeneracion = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditoriaCv.RegistrarAsync(
            TryGetActorUsuarioId(), curriculumId, CvAuditoriaAcciones.CvGeneradoGenerar, "CvGenerado", existente.CvGeneradoId,
            new Dictionary<string, string> { ["perfilId"] = perfilId.ToString() }, ct);

        return new CvGeneradoDto(
            existente.CvGeneradoId, perfilId, perfil.NombrePerfil ?? string.Empty,
            contenido, existente.FechaGeneracion, promptPorDefecto);
    }

    /// <summary>Arma el material que efectivamente entra al CV, acotado por reglas
    /// determinísticas (no por instrucciones al modelo):
    /// - Experiencia: solo las 3 más recientes (un CV de 3 hojas no lista toda la carrera).
    /// - Formación: Pregrado, Posgrado, Diplomados y Certificaciones -- este CV no está
    ///   atado a una oferta puntual, así que diplomados y certificaciones también aportan.
    ///   Cursos queda fuera.
    /// - Proyectos y Habilidades: pasan completos -- la IA decide cómo resumirlos/
    ///   priorizarlos, eso es juicio de redacción y va en el prompt, no aquí.</summary>
    private async Task<string> ArmarCurriculumJsonAsync(int curriculumId, CancellationToken ct)
    {
        var experiencias = await _context.Experiencias.AsNoTracking()
            .Where(e => e.CurriculumId == curriculumId && e.MostrarEnCv)
            .OrderByDescending(e => e.EsActual).ThenByDescending(e => e.FechaInicio)
            .Take(3)
            .Select(e => new
            {
                e.Empresa,
                e.Cargo,
                e.Sector,
                e.TipoContrato,
                e.EsActual,
                e.FechaInicio,
                e.FechaFin,
                e.Funciones,
            })
            .ToListAsync(ct);

        var formaciones = await _context.Formaciones.AsNoTracking()
            .Where(f => f.CurriculumId == curriculumId && f.MostrarEnCv
                && (f.TipoFormacion == "Pregrado" || f.TipoFormacion == "Posgrado"
                    || f.TipoFormacion == "Diplomado" || f.TipoFormacion == "Certificacion"))
            .OrderByDescending(f => f.FechaFin)
            .Select(f => new
            {
                f.Titulo,
                f.Institucion,
                f.Area,
                f.TipoFormacion,
                f.FechaInicio,
                f.FechaFin,
                f.DuracionHoras,
                f.Descripcion,
            })
            .ToListAsync(ct);

        var proyectos = await _context.Proyectos.AsNoTracking()
            .Where(p => p.CurriculumId == curriculumId && p.MostrarEnCv)
            .Select(p => new
            {
                p.NombreProyecto,
                p.Rol,
                p.DuracionMeses,
                p.StackTecnologico,
                p.Aporte,
                p.Logro,
                p.Desafio,
            })
            .ToListAsync(ct);

        var habilidades = await _context.Habilidades.AsNoTracking()
            .Where(h => h.CurriculumId == curriculumId && h.MostrarEnCv)
            .Select(h => new { h.Nombre, h.Tipo, h.Nivel })
            .ToListAsync(ct);

        return JsonSerializer.Serialize(new { experiencias, formaciones, proyectos, habilidades }, JsonOpciones);
    }

    /// <summary>Nombre (recortado, sin distinguir mayúsculas) -> Tipo real de la
    /// habilidad -- la IA solo devuelve el nombre; esto permite que el front (plantilla
    /// Corporativo) agrupe en Técnicas/Blandas/Idiomas igual que "Profesional".</summary>
    private async Task<Dictionary<string, string?>> ObtenerTiposHabilidadAsync(int curriculumId, CancellationToken ct)
    {
        var habilidades = await _context.Habilidades.AsNoTracking()
            .Where(h => h.CurriculumId == curriculumId && h.MostrarEnCv)
            .Select(h => new { h.Nombre, h.Tipo })
            .ToListAsync(ct);

        return habilidades
            .Where(h => !string.IsNullOrWhiteSpace(h.Nombre))
            .GroupBy(h => h.Nombre!.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First().Tipo, StringComparer.OrdinalIgnoreCase);
    }

    private static CvGeneradoDto Map(CvGenerado c)
    {
        var contenido = JsonSerializer.Deserialize<ContenidoCvGeneradoDto>(c.ContenidoJson, JsonOpciones)
            ?? new ContenidoCvGeneradoDto(new List<ExperienciaCondensadaDto>(), new List<string>(), new List<string>(), new List<HabilidadCondensadaDto>());
        return new CvGeneradoDto(c.CvGeneradoId, c.PerfilId, c.Perfil.NombrePerfil ?? string.Empty,
            contenido, c.FechaGeneracion, c.PromptPorDefecto);
    }

    private int? TryGetActorUsuarioId()
    {
        var user = _http.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true)
            return null;
        var v = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        return int.TryParse(v, out var id) && id > 0 ? id : null;
    }

    private sealed class CvPerfilGeneradoJson
    {
        public List<ExperienciaCondensadaJson>? Experiencia { get; set; }
        public List<string>? Educacion { get; set; }
        public List<string>? Proyectos { get; set; }
        public List<string>? Habilidades { get; set; }
    }

    private sealed class ExperienciaCondensadaJson
    {
        public string? Cabecera { get; set; }
        public List<string>? Funciones { get; set; }
    }
}
