using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/referencias")]
public class ReferenciaController : CvControllerBase
{
    private readonly ICvEditorService _editor;

    public ReferenciaController(ICvEditorService editor)
    {
        _editor = editor;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _editor.GetReferenciasAsync(GetCurriculumId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertReferenciaRequest request, CancellationToken ct = default)
    {
        var result = await _editor.CreateReferenciaAsync(GetCurriculumId(), request, ct);
        return CreatedAtAction(nameof(GetAll), new { }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertReferenciaRequest request, CancellationToken ct = default)
        => Ok(await _editor.UpdateReferenciaAsync(GetCurriculumId(), id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _editor.DeleteReferenciaAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }
}

