using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/visibilidad")]
public class VisibilidadController : CvControllerBase
{
    private readonly ICvEditorService _editor;
    private readonly IPublicCvService _publicCvService;

    public VisibilidadController(ICvEditorService editor, IPublicCvService publicCvService)
    {
        _editor = editor;
        _publicCvService = publicCvService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _editor.GetVisibilidadAsync(GetCurriculumId(), ct));

    /// <summary>Actualización por lote: enviar la lista completa de secciones a actualizar.</summary>
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] IEnumerable<UpdateVisibilidadRequest> cambios, CancellationToken ct = default)
        => Ok(await _editor.UpdateVisibilidadAsync(GetCurriculumId(), cambios, ct));

    /// <summary>Cómo se vería el CV público con la visibilidad actual -- para el panel de
    /// vista previa en Configuración. Funciona aunque el CV esté en Borrador.</summary>
    [HttpGet("preview-publico")]
    public async Task<IActionResult> GetPreviewPublico(CancellationToken ct = default)
        => Ok(await _publicCvService.GetPreviewPrivadoAsync(GetCurriculumId(), ct));
}

