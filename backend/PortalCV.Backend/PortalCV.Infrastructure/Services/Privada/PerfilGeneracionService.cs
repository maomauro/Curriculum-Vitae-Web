using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PortalCV.Application.Constants;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class PerfilGeneracionService : IPerfilGeneracionService
{
    private const string CodigoPromptGenerador = "GENERADOR_PERFIL";
    private const string CodigoPromptSugeridor = "SUGERIDOR_ENFOQUE_PERFIL";
    private static readonly JsonSerializerOptions JsonOpciones = new(JsonSerializerDefaults.Web);

    private readonly PortalCvDbContext _context;
    private readonly IIaPromptInvoker _invoker;

    public PerfilGeneracionService(PortalCvDbContext context, IIaPromptInvoker invoker)
    {
        _context = context;
        _invoker = invoker;
    }

    public async Task<PerfilGeneradoIaDto> GenerarAsync(
        int curriculumId, GenerarPerfilConIaRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Enfoque))
            throw new ArgumentException("El enfoque del perfil es requerido.");

        var curriculumJson = await ArmarCurriculumJsonAsync(curriculumId, ct);
        var valores = new Dictionary<string, string>
        {
            ["ENFOQUE"] = request.Enfoque.Trim(),
            ["CURRICULUM_JSON"] = curriculumJson,
        };

        var (textoRespuesta, promptPorDefecto) = await _invoker.InvocarAsync(
            curriculumId, CodigoPromptGenerador, PromptsPorDefecto.GeneradorPerfil, valores, ct: ct);

        var generado = RespuestaIaJsonParser.Parsear<PerfilGeneradoJson>(textoRespuesta);
        var nombre = string.IsNullOrWhiteSpace(generado.NombrePerfil) ? request.Enfoque.Trim() : generado.NombrePerfil.Trim();
        var descripcion = generado.DescripcionPerfil?.Trim() ?? string.Empty;

        return new PerfilGeneradoIaDto(nombre, descripcion, promptPorDefecto);
    }

    /// <summary>A diferencia de GenerarAsync (que recibe un enfoque ya escrito por el
    /// usuario), acá no hay ningún dato de entrada más que el currículum -- la IA mira
    /// todo y propone ideas de entrada. Filtra defensivamente cualquier sugerencia que
    /// coincida (sin distinguir mayúsculas/acentos) con un perfil ya existente, por si la
    /// IA no respeta la instrucción del prompt.</summary>
    public async Task<SugerirEnfoquesPerfilResponse> SugerirEnfoquesAsync(int curriculumId, CancellationToken ct = default)
    {
        var nombresExistentes = await _context.Perfiles.AsNoTracking()
            .Where(p => p.CurriculumId == curriculumId && p.NombrePerfil != null)
            .Select(p => p.NombrePerfil!)
            .ToListAsync(ct);

        var curriculumJson = await ArmarCurriculumJsonAsync(curriculumId, ct);
        var valores = new Dictionary<string, string>
        {
            ["CURRICULUM_JSON"] = curriculumJson,
            ["PERFILES_EXISTENTES_JSON"] = JsonSerializer.Serialize(nombresExistentes, JsonOpciones),
        };

        var (textoRespuesta, promptPorDefecto) = await _invoker.InvocarAsync(
            curriculumId, CodigoPromptSugeridor, PromptsPorDefecto.SugeridorEnfoquePerfil, valores, ct: ct);

        var generado = RespuestaIaJsonParser.Parsear<EnfoquesSugeridosJson>(textoRespuesta);
        var existentesNormalizados = nombresExistentes
            .Select(Normalizar)
            .ToHashSet();

        var sugerencias = (generado.Sugerencias ?? new List<EnfoqueSugeridoJson>())
            .Where(s => !string.IsNullOrWhiteSpace(s.Nombre))
            .Select(s => new EnfoqueSugeridoDto(s.Nombre!.Trim(), s.Razon?.Trim() ?? string.Empty))
            .Where(s => !existentesNormalizados.Contains(Normalizar(s.Nombre)))
            .ToList();

        return new SugerirEnfoquesPerfilResponse(sugerencias, promptPorDefecto);
    }

    private static string Normalizar(string texto) => texto.Trim().ToUpperInvariant();

    /// <summary>Tope por campo de texto libre (Funciones, Descripción, Aporte/Logro/
    /// Desafío) -- ver Recortar(). Algunos proveedores de IA (ej. Groq) devuelven 413
    /// "payload too large" si el currículum completo de una carrera larga (varios cargos
    /// con listas extensas de funciones) se manda tal cual.</summary>
    private const int MaxCaracteresTextoLibre = 600;

    /// <summary>A diferencia de CvGeneradoService.ArmarCurriculumJsonAsync, aquí SÍ
    /// entran todas las experiencias y formaciones (no solo las 3 más recientes ni solo
    /// Pregrado/Posgrado) -- un Perfil no tiene el límite de 3 hojas de un CV final y se
    /// beneficia de ver la carrera completa. Lo que sí se acota es cuánto texto libre
    /// entra POR CAMPO, para no romper el límite de tamaño de request de algunos
    /// proveedores.</summary>
    private async Task<string> ArmarCurriculumJsonAsync(int curriculumId, CancellationToken ct)
    {
        var experienciasDb = await _context.Experiencias.AsNoTracking()
            .Where(e => e.CurriculumId == curriculumId && e.MostrarEnCv)
            .OrderByDescending(e => e.EsActual).ThenByDescending(e => e.FechaInicio)
            .ToListAsync(ct);
        var experiencias = experienciasDb.Select(e => new
        {
            e.Empresa,
            e.Cargo,
            e.Sector,
            e.TipoContrato,
            e.EsActual,
            e.FechaInicio,
            e.FechaFin,
            Funciones = Recortar(e.Funciones),
        });

        var formacionesDb = await _context.Formaciones.AsNoTracking()
            .Where(f => f.CurriculumId == curriculumId && f.MostrarEnCv)
            .OrderByDescending(f => f.FechaFin)
            .ToListAsync(ct);
        var formaciones = formacionesDb.Select(f => new
        {
            f.Titulo,
            f.Institucion,
            f.Area,
            f.TipoFormacion,
            f.FechaInicio,
            f.FechaFin,
            f.DuracionHoras,
            Descripcion = Recortar(f.Descripcion),
        });

        var proyectosDb = await _context.Proyectos.AsNoTracking()
            .Where(p => p.CurriculumId == curriculumId && p.MostrarEnCv)
            .ToListAsync(ct);
        var proyectos = proyectosDb.Select(p => new
        {
            p.NombreProyecto,
            p.Rol,
            p.DuracionMeses,
            p.StackTecnologico,
            Aporte = Recortar(p.Aporte),
            Logro = Recortar(p.Logro),
            Desafio = Recortar(p.Desafio),
        });

        var habilidades = await _context.Habilidades.AsNoTracking()
            .Where(h => h.CurriculumId == curriculumId && h.MostrarEnCv)
            .Select(h => new { h.Nombre, h.Tipo, h.Nivel })
            .ToListAsync(ct);

        return JsonSerializer.Serialize(new { experiencias, formaciones, proyectos, habilidades }, JsonOpciones);
    }

    private static string? Recortar(string? texto) =>
        string.IsNullOrEmpty(texto) || texto.Length <= MaxCaracteresTextoLibre
            ? texto
            : texto[..MaxCaracteresTextoLibre] + "…";

    private sealed class PerfilGeneradoJson
    {
        public string? NombrePerfil { get; set; }
        public string? DescripcionPerfil { get; set; }
    }

    private sealed class EnfoquesSugeridosJson
    {
        public List<EnfoqueSugeridoJson>? Sugerencias { get; set; }
    }

    private sealed class EnfoqueSugeridoJson
    {
        public string? Nombre { get; set; }
        public string? Razon { get; set; }
    }
}
