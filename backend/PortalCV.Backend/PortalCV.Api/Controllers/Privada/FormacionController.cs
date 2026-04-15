using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.Constants;
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

    /// <summary>Devuelve 400 si el JWT no trae un curriculum válido (misma regla en todos los verbos).</summary>
    private IActionResult? BadIfCurriculumInvalid(out int curriculumId)
    {
        curriculumId = GetCurriculumId();
        if (curriculumId <= 0)
        {
            return BadRequest(new { message = ApiMessages.Cv.SesionSinCurriculumValido });
        }

        return null;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
    {
        var err = BadIfCurriculumInvalid(out var curriculumId);
        if (err is not null)
        {
            return err;
        }

        return Ok(await _editor.GetFormacionesAsync(curriculumId, ct));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertFormacionRequest request, CancellationToken ct = default)
    {
        var err = BadIfCurriculumInvalid(out var curriculumId);
        if (err is not null)
        {
            return err;
        }

        var result = await _editor.CreateFormacionAsync(curriculumId, request, ct);
        // Ok en lugar de CreatedAtAction: evita 500 si falla la generación de URL con rutas por atributos.
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertFormacionRequest request, CancellationToken ct = default)
    {
        var err = BadIfCurriculumInvalid(out var curriculumId);
        if (err is not null)
        {
            return err;
        }

        return Ok(await _editor.UpdateFormacionAsync(curriculumId, id, request, ct));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var err = BadIfCurriculumInvalid(out var curriculumId);
        if (err is not null)
        {
            return err;
        }

        await _editor.DeleteFormacionAsync(curriculumId, id, ct);
        return NoContent();
    }
}
