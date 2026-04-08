using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/personales")]
public class PersonalesController : CvControllerBase
{
    private readonly ICvEditorService _editor;

    public PersonalesController(ICvEditorService editor)
    {
        _editor = editor;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct = default)
    {
        var curriculumId = GetCurriculumId();
        var result = await _editor.GetPersonalesAsync(curriculumId, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Upsert([FromBody] UpsertPersonalesRequest request, CancellationToken ct = default)
    {
        var curriculumId = GetCurriculumId();
        var result = await _editor.UpsertPersonalesAsync(curriculumId, request, ct);
        return Ok(result);
    }
}

