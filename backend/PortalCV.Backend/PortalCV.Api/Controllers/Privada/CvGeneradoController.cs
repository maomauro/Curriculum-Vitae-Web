using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

/// <summary>CVs generales generados por IA a partir de un Perfil (uno por Perfil, sin
/// oferta de por medio) -- consumido por /mi-cv. La generación vive en
/// POST /api/cv/perfiles/{id}/generar-cv (PerfilController).</summary>
[Route("api/cv/cv-generado")]
public class CvGeneradoController : CvControllerBase
{
    private readonly ICvGeneradoService _cvGenerado;

    public CvGeneradoController(ICvGeneradoService cvGenerado)
    {
        _cvGenerado = cvGenerado;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _cvGenerado.ListarAsync(GetCurriculumId(), ct));
}
