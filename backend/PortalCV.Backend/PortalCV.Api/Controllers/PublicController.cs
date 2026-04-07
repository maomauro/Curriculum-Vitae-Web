using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Public;
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

    /// <summary>Listado paginado de CVs públicos con filtros opcionales.</summary>
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

    /// <summary>Detalle completo de un CV por su URL pública.</summary>
    [HttpGet("cvs/{urlPublica}")]
    public async Task<IActionResult> GetDetalle(string urlPublica, CancellationToken ct = default)
    {
        var detalle = await _publicCvService.GetDetalleAsync(urlPublica, ct);
        if (detalle is null) return NotFound();
        return Ok(detalle);
    }

    /// <summary>Formulario de contacto para el propietario de un CV.</summary>
    [HttpPost("cvs/{curriculumId:int}/contactar")]
    public async Task<IActionResult> Contactar(
        int curriculumId,
        [FromBody] ContactarCvRequest request,
        CancellationToken ct = default)
    {
        await _publicCvService.ContactarAsync(curriculumId, request, ct);
        return Ok(new { message = "Mensaje enviado correctamente." });
    }
}
