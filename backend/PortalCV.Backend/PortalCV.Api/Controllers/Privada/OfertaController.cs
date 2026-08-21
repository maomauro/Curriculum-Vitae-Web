using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/ofertas")]
public class OfertaController : CvControllerBase
{
    private readonly ICvEditorService _editor;

    public OfertaController(ICvEditorService editor)
    {
        _editor = editor;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _editor.GetOfertasAsync(GetCurriculumId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertOfertaRequest request, CancellationToken ct = default)
    {
        var result = await _editor.CreateOfertaAsync(GetCurriculumId(), request, ct);
        return CreatedAtAction(nameof(GetAll), new { }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertOfertaRequest request, CancellationToken ct = default)
        => Ok(await _editor.UpdateOfertaAsync(GetCurriculumId(), id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _editor.DeleteOfertaAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }
}
