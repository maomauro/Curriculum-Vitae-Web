using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/contactos")]
public class ContactosController : CvControllerBase
{
    private readonly IDashboardService _dashboardService;

    public ContactosController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>Lista de mensajes de contacto recibidos por el publicador.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _dashboardService.GetContactosAsync(GetCurriculumId(), ct));

    /// <summary>Marca un contacto específico como leído.</summary>
    [HttpPut("{id:int}/leer")]
    public async Task<IActionResult> MarcarLeido(int id, CancellationToken ct = default)
    {
        await _dashboardService.MarcarContactoLeidoAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }
}
