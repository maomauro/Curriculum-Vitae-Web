using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/notificaciones")]
public class NotificacionesController : CvControllerBase
{
    private readonly IDashboardService _dashboardService;

    public NotificacionesController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>
    /// Resumen de notificaciones para la campanita:
    /// conteo de alertas no-leídas + últimas N alertas recientes.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetNotificaciones(
        [FromQuery] int limite = 10,
        CancellationToken ct = default)
        => Ok(await _dashboardService.GetNotificacionesAsync(GetCurriculumId(), limite, ct));
}
