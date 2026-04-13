using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.Constants;
using PortalCV.Application.DTOs.Publica;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicController : ControllerBase
{
    private readonly IPublicCvService _publicCvService;

    public PublicController(IPublicCvService publicCvService)
    {
        _publicCvService = publicCvService;
    }

    /// <summary>Listado paginado de CVs publicos con filtros opcionales.</summary>
    [HttpGet("cvs")]
    public async Task<IActionResult> BuscarCvs(
        [FromQuery] string? ciudad,
        [FromQuery] string? habilidad,
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize is < 1 or > 50) pageSize = 12;

        var query = new BuscarCvsQuery(ciudad, habilidad, q, page, pageSize);
        var (items, total) = await _publicCvService.BuscarCvsAsync(query, ct);

        return Ok(new
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)total / pageSize)
        });
    }

    /// <summary>Detalle completo de un CV por su URL publica.</summary>
    /// <param name="vid">UUID anónimo del navegador (localStorage) para deduplicar vistas del mismo visitante.</param>
    [HttpGet("cvs/{urlPublica}")]
    public async Task<IActionResult> GetDetalle(
        string urlPublica,
        [FromQuery] string? vid = null,
        CancellationToken ct = default)
    {
        var detalle = await _publicCvService.GetDetalleAsync(urlPublica, vid, ct);
        if (detalle is null) return NotFound();
        return Ok(detalle);
    }

    /// <summary>Estadisticas publicas de un CV (visitas, contactos, ultima visita).</summary>
    [HttpGet("cvs/{urlPublica}/stats")]
    public async Task<IActionResult> GetEstadisticas(string urlPublica, CancellationToken ct = default)
    {
        var stats = await _publicCvService.GetEstadisticasAsync(urlPublica, ct);
        if (stats is null) return NotFound();
        return Ok(stats);
    }

    /// <summary>Listas de ciudades y habilidades disponibles para filtros del buscador.</summary>
    [HttpGet("filters")]
    public async Task<IActionResult> GetFiltros(CancellationToken ct = default)
        => Ok(await _publicCvService.GetFiltrosAsync(ct));

    /// <summary>Formulario de contacto para el propietario de un CV.</summary>
    [HttpPost("cvs/{urlPublica}/contactar")]
    public async Task<IActionResult> Contactar(
        string urlPublica,
        [FromBody] ContactarCvRequest request,
        CancellationToken ct = default)
    {
        await _publicCvService.ContactarAsync(urlPublica, request, ct);
        return Ok(new { message = ApiMessages.Publico.MensajeEnviadoCorrectamente });
    }

    /// <summary>Registra que un visitante abrió el diálogo de impresión o guardó PDF del CV público.</summary>
    [HttpPost("cvs/{urlPublica}/imprimir")]
    public async Task<IActionResult> RegistrarImpresion(
        string urlPublica,
        [FromQuery] string? vid = null,
        CancellationToken ct = default)
    {
        await _publicCvService.RegistrarImpresionPdfAsync(urlPublica, vid, ct);
        return NoContent();
    }

    /// <summary>Registra impresión/PDF (misma lógica que POST cvs/slug/imprimir). Ruta estable para el cliente.</summary>
    [HttpPost("acciones/imprimir-cv")]
    public async Task<IActionResult> RegistrarImpresionPorCuerpo(
        [FromBody] RegistrarImpresionCvRequest? body,
        CancellationToken ct = default)
    {
        var slug = body?.UrlPublica?.Trim();
        if (string.IsNullOrEmpty(slug))
            return BadRequest(new { message = "urlPublica es obligatoria." });

        await _publicCvService.RegistrarImpresionPdfAsync(slug, body?.VisitanteAnonimoId, ct);
        return NoContent();
    }
}

