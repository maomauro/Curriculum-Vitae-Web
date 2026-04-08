using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/familiares")]
public class FamiliarContactoController : CvControllerBase
{
    private readonly ICvEditorService _editor;

    public FamiliarContactoController(ICvEditorService editor)
    {
        _editor = editor;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _editor.GetFamiliaresAsync(GetCurriculumId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertFamiliarContactoRequest request, CancellationToken ct = default)
    {
        var result = await _editor.CreateFamiliarAsync(GetCurriculumId(), request, ct);
        return CreatedAtAction(nameof(GetAll), new { }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertFamiliarContactoRequest request, CancellationToken ct = default)
        => Ok(await _editor.UpdateFamiliarAsync(GetCurriculumId(), id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _editor.DeleteFamiliarAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }
}

