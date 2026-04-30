using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/proyectos")]
public class ProyectoController : CvControllerBase
{
    private readonly ICvEditorService _editor;

    public ProyectoController(ICvEditorService editor)
    {
        _editor = editor;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _editor.GetProyectosAsync(GetCurriculumId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertProyectoRequest request, CancellationToken ct = default)
    {
        var result = await _editor.CreateProyectoAsync(GetCurriculumId(), request, ct);
        return CreatedAtAction(nameof(GetAll), new { }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertProyectoRequest request, CancellationToken ct = default)
        => Ok(await _editor.UpdateProyectoAsync(GetCurriculumId(), id, request, ct));

    [HttpPatch("{id:int}/visibilidad")]
    [HttpPut("{id:int}/visibilidad")]
    public async Task<IActionResult> UpdateVisibilidad(
        int id,
        [FromBody] UpdateProyectoVisibilidadRequest request,
        CancellationToken ct = default)
        => Ok(await _editor.UpdateProyectoVisibilidadAsync(GetCurriculumId(), id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _editor.DeleteProyectoAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }
}

