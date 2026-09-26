using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/experiencias")]
public class ExperienciaController : CvControllerBase
{
    private readonly ICvEditorService _editor;

    public ExperienciaController(ICvEditorService editor)
    {
        _editor = editor;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _editor.GetExperienciasAsync(GetCurriculumId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertExperienciaRequest request, CancellationToken ct = default)
    {
        var result = await _editor.CreateExperienciaAsync(GetCurriculumId(), request, ct);
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertExperienciaRequest request, CancellationToken ct = default)
        => Ok(await _editor.UpdateExperienciaAsync(GetCurriculumId(), id, request, ct));

    [HttpPatch("{id:int}/visibilidad")]
    [HttpPut("{id:int}/visibilidad")]
    public async Task<IActionResult> UpdateVisibilidad(
        int id,
        [FromBody] UpdateExperienciaVisibilidadRequest request,
        CancellationToken ct = default)
        => Ok(await _editor.UpdateExperienciaVisibilidadAsync(GetCurriculumId(), id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _editor.DeleteExperienciaAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }

    /// <summary>Sube (o reemplaza) el soporte de esta experiencia (carta laboral, contrato). Solo PDF.</summary>
    [HttpPut("{id:int}/adjunto")]
    [RequestSizeLimit(4 * 1024 * 1024)]
    public async Task<IActionResult> SubirAdjunto(int id, IFormFile? archivo, CancellationToken ct = default)
    {
        if (archivo is null)
            return BadRequest(new { message = "Selecciona un archivo PDF." });

        using var ms = new MemoryStream();
        await archivo.CopyToAsync(ms, ct);
        var result = await _editor.UpsertAdjuntoExperienciaAsync(GetCurriculumId(), id, ms.ToArray(), archivo.ContentType, ct);
        return Ok(result);
    }

    [HttpDelete("{id:int}/adjunto")]
    public async Task<IActionResult> EliminarAdjunto(int id, CancellationToken ct = default)
        => Ok(await _editor.EliminarAdjuntoExperienciaAsync(GetCurriculumId(), id, ct));

    /// <summary>Sirve el adjunto en crudo (para el propio editor privado).</summary>
    [HttpGet("{id:int}/adjunto")]
    public async Task<IActionResult> GetAdjunto(int id, CancellationToken ct = default)
    {
        var archivo = await _editor.GetAdjuntoExperienciaAsync(GetCurriculumId(), id, ct);
        return archivo is null ? NotFound() : File(archivo.Contenido, archivo.ContentType);
    }
}

