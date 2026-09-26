using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using PortalCV.Application.Constants;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;

namespace PortalCV.Infrastructure.Services;

public class PromptIaService : IPromptIaService
{
    private static readonly System.Text.RegularExpressions.Regex CodigoValido =
        new("^[A-Z0-9_]{2,50}$", System.Text.RegularExpressions.RegexOptions.Compiled);

    private readonly IPromptIaRepository _prompts;
    private readonly ICvAuditoriaService _auditoriaCv;
    private readonly IHttpContextAccessor _http;

    public PromptIaService(IPromptIaRepository prompts, ICvAuditoriaService auditoriaCv, IHttpContextAccessor http)
    {
        _prompts = prompts;
        _auditoriaCv = auditoriaCv;
        _http = http;
    }

    public async Task<IReadOnlyList<PromptIaListItemDto>> ListarAsync(int curriculumId, CancellationToken ct = default)
    {
        var activos = await _prompts.ListarActivosAsync(curriculumId, ct);
        return activos.Select(MapListItem).ToList();
    }

    public async Task<IReadOnlyList<PromptIaVersionDto>> ListarVersionesAsync(int curriculumId, string codigo, CancellationToken ct = default)
    {
        var versiones = await _prompts.ListarVersionesPorCodigoAsync(curriculumId, NormalizarCodigo(codigo), ct);
        if (versiones.Count == 0)
            throw new KeyNotFoundException(ApiMessages.PromptIa.NoEncontrado);

        return versiones.Select(MapVersion).ToList();
    }

    public async Task<PromptIaVersionDto> CrearAsync(
        int curriculumId, CrearPromptIaRequest request, CancellationToken ct = default)
    {
        var codigo = ValidarYNormalizar(
            request.Codigo, request.Nombre, request.RolContexto, request.Tarea, request.FormatoSalida);

        if (await _prompts.ExisteCodigoAsync(curriculumId, codigo, ct))
            throw new ArgumentException(ApiMessages.PromptIa.CodigoDuplicado);

        var nuevo = ConstruirVersion(curriculumId, codigo, request.Nombre, request.Descripcion,
            request.RolContexto, request.Tarea, request.Reglas, request.FormatoSalida, request.Ejemplos);

        var creado = await _prompts.GuardarNuevaVersionAsync(nuevo, ct);

        await RegistrarAuditoria(curriculumId, CvAuditoriaAcciones.PromptIaCreate, creado, ct);
        return MapVersion(creado);
    }

    public async Task<PromptIaVersionDto> CrearVersionAsync(
        int curriculumId, string codigo, CrearVersionPromptIaRequest request, CancellationToken ct = default)
    {
        var codigoNormalizado = ValidarYNormalizar(
            codigo, request.Nombre, request.RolContexto, request.Tarea, request.FormatoSalida);

        var activo = await _prompts.GetActivoPorCodigoAsync(curriculumId, codigoNormalizado, ct)
            ?? throw new KeyNotFoundException(ApiMessages.PromptIa.NoEncontrado);

        var nueva = ConstruirVersion(curriculumId, codigoNormalizado, request.Nombre, request.Descripcion,
            request.RolContexto, request.Tarea, request.Reglas, request.FormatoSalida, request.Ejemplos);

        var guardada = await _prompts.GuardarNuevaVersionAsync(nueva, ct);

        await RegistrarAuditoria(curriculumId, CvAuditoriaAcciones.PromptIaVersionCreate, guardada, ct,
            new Dictionary<string, string> { ["versionAnterior"] = activo.Version.ToString() });
        return MapVersion(guardada);
    }

    public async Task<PromptIaVersionDto> ActivarVersionAsync(
        int curriculumId, int promptIaId, CancellationToken ct = default)
    {
        var activada = await _prompts.ActivarVersionAsync(curriculumId, promptIaId, ct);

        await RegistrarAuditoria(curriculumId, CvAuditoriaAcciones.PromptIaVersionActivar, activada, ct);
        return MapVersion(activada);
    }

    private Task RegistrarAuditoria(
        int curriculumId, string accion, PromptIa prompt, CancellationToken ct,
        Dictionary<string, string>? detalleExtra = null)
    {
        var detalle = detalleExtra ?? new Dictionary<string, string>();
        detalle["codigo"] = prompt.Codigo;
        detalle["version"] = prompt.Version.ToString();

        return _auditoriaCv.RegistrarAsync(TryGetActorUsuarioId(), curriculumId, accion, "PromptIa", prompt.PromptIaId, detalle, ct);
    }

    private int? TryGetActorUsuarioId()
    {
        var user = _http.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true)
            return null;
        var v = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        return int.TryParse(v, out var id) && id > 0 ? id : null;
    }

    private PromptIa ConstruirVersion(
        int curriculumId, string codigo, string nombre, string? descripcion,
        string rolContexto, string tarea, string? reglas, string formatoSalida, string? ejemplos) => new()
    {
        CurriculumId = curriculumId,
        Codigo = codigo,
        Nombre = nombre.Trim(),
        Descripcion = string.IsNullOrWhiteSpace(descripcion) ? null : descripcion.Trim(),
        RolContexto = rolContexto.Trim(),
        Tarea = tarea.Trim(),
        Reglas = string.IsNullOrWhiteSpace(reglas) ? null : reglas.Trim(),
        FormatoSalida = formatoSalida.Trim(),
        Ejemplos = string.IsNullOrWhiteSpace(ejemplos) ? null : ejemplos.Trim(),
        Contenido = EnsamblarContenido(rolContexto, tarea, reglas, formatoSalida, ejemplos),
        ActualizadoPorUsuarioId = TryGetActorUsuarioId(),
    };

    /// <summary>
    /// Arma el texto final del prompt a partir de sus 5 secciones, en orden. Es lo único que se
    /// vuelve a calcular en cada guardado — el resultado nunca se edita a mano.
    /// </summary>
    private static string EnsamblarContenido(string rolContexto, string tarea, string? reglas, string formatoSalida, string? ejemplos)
    {
        var partes = new List<string>
        {
            "[ROL Y CONTEXTO]",
            rolContexto.Trim(),
            string.Empty,
            "[TAREA]",
            tarea.Trim(),
        };

        if (!string.IsNullOrWhiteSpace(reglas))
        {
            partes.Add(string.Empty);
            partes.Add("[REGLAS]");
            partes.Add(reglas.Trim());
        }

        partes.Add(string.Empty);
        partes.Add("[FORMATO DE SALIDA]");
        partes.Add(formatoSalida.Trim());

        if (!string.IsNullOrWhiteSpace(ejemplos))
        {
            partes.Add(string.Empty);
            partes.Add("[EJEMPLOS]");
            partes.Add(ejemplos.Trim());
        }

        return string.Join('\n', partes);
    }

    private static string ValidarYNormalizar(string? codigo, string? nombre, string? rolContexto, string? tarea, string? formatoSalida)
    {
        var codigoNormalizado = NormalizarCodigo(codigo);

        if (string.IsNullOrWhiteSpace(codigoNormalizado))
            throw new ArgumentException(ApiMessages.PromptIa.CodigoRequerido);
        if (!CodigoValido.IsMatch(codigoNormalizado))
            throw new ArgumentException(ApiMessages.PromptIa.CodigoInvalido);
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException(ApiMessages.PromptIa.NombreRequerido);
        if (string.IsNullOrWhiteSpace(rolContexto))
            throw new ArgumentException(ApiMessages.PromptIa.RolContextoRequerido);
        if (string.IsNullOrWhiteSpace(tarea))
            throw new ArgumentException(ApiMessages.PromptIa.TareaRequerida);
        if (string.IsNullOrWhiteSpace(formatoSalida))
            throw new ArgumentException(ApiMessages.PromptIa.FormatoSalidaRequerido);

        return codigoNormalizado;
    }

    private static string NormalizarCodigo(string? codigo) => codigo?.Trim().ToUpperInvariant() ?? string.Empty;

    private static PromptIaListItemDto MapListItem(PromptIa p) => new()
    {
        PromptIaId = p.PromptIaId,
        Codigo = p.Codigo,
        Nombre = p.Nombre,
        Descripcion = p.Descripcion,
        VersionActiva = p.Version,
        FechaActualizacion = p.FechaCreacion,
    };

    private static PromptIaVersionDto MapVersion(PromptIa p) => new()
    {
        PromptIaId = p.PromptIaId,
        Codigo = p.Codigo,
        Nombre = p.Nombre,
        Descripcion = p.Descripcion,
        RolContexto = p.RolContexto,
        Tarea = p.Tarea,
        Reglas = p.Reglas,
        FormatoSalida = p.FormatoSalida,
        Ejemplos = p.Ejemplos,
        Contenido = p.Contenido,
        Version = p.Version,
        EsActivo = p.EsActivo,
        FechaCreacion = p.FechaCreacion,
    };
}
