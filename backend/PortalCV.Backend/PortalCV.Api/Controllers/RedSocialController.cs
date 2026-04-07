using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Curriculum;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/redes-sociales")]
public class RedSocialController : CvControllerBase
{
    private readonly ICvEditorService _editor;

    public RedSocialController(ICvEditorService editor)
    {
        _editor = editor;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _editor.GetRedesSocialesAsync(GetCurriculumId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertRedSocialRequest request, CancellationToken ct = default)
    {
        var result = await _editor.CreateRedSocialAsync(GetCurriculumId(), request, ct);
        return CreatedAtAction(nameof(GetAll), new { }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertRedSocialRequest request, CancellationToken ct = default)
        => Ok(await _editor.UpdateRedSocialAsync(GetCurriculumId(), id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _editor.DeleteRedSocialAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }
}
