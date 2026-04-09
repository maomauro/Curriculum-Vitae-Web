using Microsoft.AspNetCore.Mvc;
using PortalCV.Application;
using PortalCV.Application.Constants;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/presentacion")]
public class PresentacionController : CvControllerBase
{
    private readonly ICvEditorService _editor;

    public PresentacionController(ICvEditorService editor)
    {
        _editor = editor;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct = default)
    {
        var id = GetCurriculumId();
        if (id <= 0)
            return BadRequest(new { message = ApiMessages.Cv.SesionSinCurriculumValido });
        return Ok(await _editor.GetPresentacionAsync(id, ct));
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdatePresentacionCvRequest request, CancellationToken ct = default)
    {
        var id = GetCurriculumId();
        if (id <= 0)
            return BadRequest(new { message = ApiMessages.Cv.SesionSinCurriculumValido });
        var code = CvPlantillaCodigos.TryNormalize(request.PlantillaCodigo);
        if (code is null)
            return BadRequest(new { message = ApiMessages.Cv.PlantillaInvalida });
        return Ok(await _editor.UpdatePresentacionAsync(id, new UpdatePresentacionCvRequest(code), ct));
    }
}
