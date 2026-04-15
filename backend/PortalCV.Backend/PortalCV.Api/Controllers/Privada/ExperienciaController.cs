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

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _editor.DeleteExperienciaAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }
}

