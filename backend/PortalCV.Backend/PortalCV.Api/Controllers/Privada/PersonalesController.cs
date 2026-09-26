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

    /// <summary>Sube (o reemplaza) la foto de perfil como binario. Límite de tamaño real
    /// lo valida el servicio (1 MB); el límite de request aquí es solo un margen de
    /// seguridad para no dejar pasar payloads absurdamente grandes sin motivo.</summary>
    [HttpPut("foto")]
    [RequestSizeLimit(2 * 1024 * 1024)]
    public async Task<IActionResult> SubirFoto(IFormFile? archivo, CancellationToken ct = default)
    {
        if (archivo is null)
            return BadRequest(new { message = "Selecciona un archivo de imagen." });

        var curriculumId = GetCurriculumId();
        using var ms = new MemoryStream();
        await archivo.CopyToAsync(ms, ct);
        var result = await _editor.UpsertFotoPersonalesAsync(curriculumId, ms.ToArray(), archivo.ContentType, ct);
        return Ok(result);
    }

    [HttpDelete("foto")]
    public async Task<IActionResult> EliminarFoto(CancellationToken ct = default)
    {
        var curriculumId = GetCurriculumId();
        var result = await _editor.EliminarFotoPersonalesAsync(curriculumId, ct);
        return Ok(result);
    }

    /// <summary>Sirve la foto en crudo (para el propio &lt;img&gt; del editor privado).</summary>
    [HttpGet("foto")]
    public async Task<IActionResult> GetFoto(CancellationToken ct = default)
    {
        var curriculumId = GetCurriculumId();
        var foto = await _editor.GetFotoPersonalesAsync(curriculumId, ct);
        return foto is null ? NotFound() : File(foto.Contenido, foto.ContentType);
    }
}

