using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/formaciones")]
public class FormacionController : CvControllerBase
{
    private readonly ICvEditorService _editor;

    public FormacionController(ICvEditorService editor)
    {
        _editor = editor;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _editor.GetFormacionesAsync(GetCurriculumId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertFormacionRequest request, CancellationToken ct = default)
    {
        var result = await _editor.CreateFormacionAsync(GetCurriculumId(), request, ct);
        // Ok en lugar de CreatedAtAction: evita 500 si falla la generación de URL con rutas por atributos.
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertFormacionRequest request, CancellationToken ct = default)
        => Ok(await _editor.UpdateFormacionAsync(GetCurriculumId(), id, request, ct));

    [HttpPatch("{id:int}/visibilidad")]
    [HttpPut("{id:int}/visibilidad")]
    public async Task<IActionResult> UpdateVisibilidad(
        int id,
        [FromBody] UpdateFormacionVisibilidadRequest request,
        CancellationToken ct = default)
        => Ok(await _editor.UpdateFormacionVisibilidadAsync(GetCurriculumId(), id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _editor.DeleteFormacionAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }

    /// <summary>Sube (o reemplaza) el soporte de esta formación (diploma, certificado). Solo PDF.</summary>
    [HttpPut("{id:int}/adjunto")]
    [RequestSizeLimit(4 * 1024 * 1024)]
    public async Task<IActionResult> SubirAdjunto(int id, IFormFile? archivo, CancellationToken ct = default)
    {
        if (archivo is null)
            return BadRequest(new { message = "Selecciona un archivo PDF." });

        using var ms = new MemoryStream();
        await archivo.CopyToAsync(ms, ct);
        var result = await _editor.UpsertAdjuntoFormacionAsync(GetCurriculumId(), id, ms.ToArray(), archivo.ContentType, ct);
        return Ok(result);
    }

    [HttpDelete("{id:int}/adjunto")]
    public async Task<IActionResult> EliminarAdjunto(int id, CancellationToken ct = default)
        => Ok(await _editor.EliminarAdjuntoFormacionAsync(GetCurriculumId(), id, ct));

    /// <summary>Sirve el adjunto en crudo (para el propio editor privado).</summary>
    [HttpGet("{id:int}/adjunto")]
    public async Task<IActionResult> GetAdjunto(int id, CancellationToken ct = default)
    {
        var archivo = await _editor.GetAdjuntoFormacionAsync(GetCurriculumId(), id, ct);
        return archivo is null ? NotFound() : File(archivo.Contenido, archivo.ContentType);
    }
}
