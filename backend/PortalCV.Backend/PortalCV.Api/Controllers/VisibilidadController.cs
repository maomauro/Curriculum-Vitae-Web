using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Curriculum;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/visibilidad")]
public class VisibilidadController : CvControllerBase
{
    private readonly ICvEditorService _editor;

    public VisibilidadController(ICvEditorService editor)
    {
        _editor = editor;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _editor.GetVisibilidadAsync(GetCurriculumId(), ct));

    /// <summary>Actualización por lote: enviar la lista completa de secciones a actualizar.</summary>
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] IEnumerable<UpdateVisibilidadRequest> cambios, CancellationToken ct = default)
        => Ok(await _editor.UpdateVisibilidadAsync(GetCurriculumId(), cambios, ct));
}
