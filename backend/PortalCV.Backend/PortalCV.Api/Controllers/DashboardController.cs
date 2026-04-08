using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/dashboard")]
public class DashboardController : CvControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>Estadísticas agregadas del CV: visitas, contactos, alertas no leídas y % completitud.</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct = default)
        => Ok(await _dashboardService.GetStatsAsync(GetCurriculumId(), ct));
}
