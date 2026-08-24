using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/perfiles")]
public class PerfilController : CvControllerBase
{
    private readonly ICvEditorService _editor;
    private readonly IPerfilGeneracionService _generacionIa;
    private readonly ICvGeneradoService _cvGenerado;

    public PerfilController(
        ICvEditorService editor, IPerfilGeneracionService generacionIa, ICvGeneradoService cvGenerado)
    {
        _editor = editor;
        _generacionIa = generacionIa;
        _cvGenerado = cvGenerado;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _editor.GetPerfilesAsync(GetCurriculumId(), ct));

    /// <summary>Genera con IA un borrador de Nombre + Descripción de perfil a partir de un
    /// enfoque corto y los datos reales del currículum. No persiste nada.</summary>
    [HttpPost("generar-ia")]
    public async Task<IActionResult> GenerarConIa(
        [FromBody] GenerarPerfilConIaRequest request, CancellationToken ct = default)
        => Ok(await _generacionIa.GenerarAsync(GetCurriculumId(), request, ct));

    /// <summary>Sugiere con IA ideas de enfoque de perfil a partir de todo el currículum,
    /// sin que el usuario escriba nada -- excluye los perfiles que ya tiene. No persiste
    /// nada; cada sugerencia solo precarga el campo "enfoque" en el front-end.</summary>
    [HttpPost("sugerir-enfoques")]
    public async Task<IActionResult> SugerirEnfoques(CancellationToken ct = default)
        => Ok(await _generacionIa.SugerirEnfoquesAsync(GetCurriculumId(), ct));

    /// <summary>Genera (o regenera) el CV general en formato ATS para este Perfil, con IA
    /// -- sin oferta de por medio. Uno por Perfil.</summary>
    [HttpPost("{id:int}/generar-cv")]
    public async Task<IActionResult> GenerarCv(int id, CancellationToken ct = default)
        => Ok(await _cvGenerado.GenerarAsync(GetCurriculumId(), id, ct));

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

