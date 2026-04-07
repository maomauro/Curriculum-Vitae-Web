using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Curriculum;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/habilidades")]
public class HabilidadController : CvControllerBase
{
    private readonly ICvEditorService _editor;

    public HabilidadController(ICvEditorService editor)
    {
        _editor = editor;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _editor.GetHabilidadesAsync(GetCurriculumId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertHabilidadRequest request, CancellationToken ct = default)
    {
        var result = await _editor.CreateHabilidadAsync(GetCurriculumId(), request, ct);
        return CreatedAtAction(nameof(GetAll), new { }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertHabilidadRequest request, CancellationToken ct = default)
        => Ok(await _editor.UpdateHabilidadAsync(GetCurriculumId(), id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _editor.DeleteHabilidadAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }
}
