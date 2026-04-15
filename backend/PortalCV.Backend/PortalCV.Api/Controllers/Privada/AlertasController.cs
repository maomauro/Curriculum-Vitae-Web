using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/alertas")]
public class AlertasController : CvControllerBase
{
    private readonly IAlertaService _alertaService;

    public AlertasController(IAlertaService alertaService)
    {
        _alertaService = alertaService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool soloNoLeidas = false,
        [FromQuery] string? tipo = null,
        [FromQuery] string? periodo = "mes",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
        => Ok(await _alertaService.GetAlertasAsync(GetCurriculumId(), soloNoLeidas, tipo, periodo, page, pageSize, ct));

    [HttpPut("{id:int}/leer")]
    public async Task<IActionResult> MarcarLeida(int id, CancellationToken ct = default)
    {
        await _alertaService.MarcarLeidaAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }

    [HttpPut("leer-todas")]
    public async Task<IActionResult> MarcarTodasLeidas(CancellationToken ct = default)
    {
        await _alertaService.MarcarTodasLeidasAsync(GetCurriculumId(), ct);
        return NoContent();
    }

    [HttpDelete("leidas")]
    public async Task<IActionResult> LimpiarLeidas(CancellationToken ct = default)
        => Ok(new { eliminadas = await _alertaService.LimpiarLeidasAsync(GetCurriculumId(), ct) });

    [HttpGet("no-leidas/conteo")]
    public async Task<IActionResult> GetConteoNoLeidas(CancellationToken ct = default)
        => Ok(new { conteo = await _alertaService.GetConteoNoLeidasAsync(GetCurriculumId(), ct) });
}
