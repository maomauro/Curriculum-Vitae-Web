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
        return CreatedAtAction(nameof(GetAll), new { }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertFormacionRequest request, CancellationToken ct = default)
        => Ok(await _editor.UpdateFormacionAsync(GetCurriculumId(), id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _editor.DeleteFormacionAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }
}

