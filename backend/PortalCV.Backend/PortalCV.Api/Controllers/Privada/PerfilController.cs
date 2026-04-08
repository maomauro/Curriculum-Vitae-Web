using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/perfiles")]
public class PerfilController : CvControllerBase
{
    private readonly ICvEditorService _editor;

    public PerfilController(ICvEditorService editor)
    {
        _editor = editor;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _editor.GetPerfilesAsync(GetCurriculumId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertPerfilRequest request, CancellationToken ct = default)
    {
        var result = await _editor.CreatePerfilAsync(GetCurriculumId(), request, ct);
        return CreatedAtAction(nameof(GetAll), new { }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertPerfilRequest request, CancellationToken ct = default)
        => Ok(await _editor.UpdatePerfilAsync(GetCurriculumId(), id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _editor.DeletePerfilAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }
}

