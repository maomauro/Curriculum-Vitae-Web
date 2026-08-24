using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/ofertas")]
public class OfertaController : CvControllerBase
{
    private readonly ICvEditorService _editor;
    private readonly IOfertaAnalisisService _analisis;
    private readonly IPerfilSeleccionService _seleccionPerfil;
    private readonly IOfertaEnvioService _envio;

    public OfertaController(
        ICvEditorService editor,
        IOfertaAnalisisService analisis,
        IPerfilSeleccionService seleccionPerfil,
        IOfertaEnvioService envio)
    {
        _editor = editor;
        _analisis = analisis;
        _seleccionPerfil = seleccionPerfil;
        _envio = envio;
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

    /// <summary>Extrae cargo/empresa/descripción/reclutador de una oferta laboral con IA.
    /// No persiste nada -- el resultado se guarda aparte, vía Create/Update de arriba.</summary>
    [HttpPost("analizar")]
    [RequestSizeLimit(8_000_000)]
    public async Task<IActionResult> Analizar(
        [FromForm] string? texto, IFormFile? archivo, CancellationToken ct = default)
    {
        byte[]? imagenBytes = null;
        if (archivo is { Length: > 0 })
        {
            using var ms = new MemoryStream();
            await archivo.CopyToAsync(ms, ct);
            imagenBytes = ms.ToArray();
        }

        var resultado = await _analisis.AnalizarAsync(
            GetCurriculumId(), texto, imagenBytes, archivo?.ContentType, archivo?.FileName, ct);
        return Ok(resultado);
    }

    /// <summary>Sugiere reutilizar un Perfil existente o crear uno nuevo para esta
    /// oferta, con IA. No persiste nada -- la oferta puede no estar guardada todavía.</summary>
    [HttpPost("seleccionar-perfil")]
    public async Task<IActionResult> SeleccionarPerfil(
        [FromBody] SeleccionarPerfilRequest request, CancellationToken ct = default)
        => Ok(await _seleccionPerfil.SugerirAsync(GetCurriculumId(), request, ct));

    /// <summary>Redacta con IA el asunto/cuerpo del correo para el reclutador de esta
    /// oferta. No persiste ni envía nada -- el usuario lo revisa/edita antes de
    /// POST .../enviar-correo.</summary>
    [HttpPost("{id:int}/redactar-correo")]
    public async Task<IActionResult> RedactarCorreo(int id, CancellationToken ct = default)
        => Ok(await _envio.RedactarAsync(GetCurriculumId(), id, ct));

    /// <summary>Envía el correo al reclutador con el CV ya construido del Perfil
    /// asignado adjunto en PDF.</summary>
    [HttpPost("{id:int}/enviar-correo")]
    public async Task<IActionResult> EnviarCorreo(
        int id, [FromBody] EnviarCorreoRequest request, CancellationToken ct = default)
        => Ok(await _envio.EnviarAsync(GetCurriculumId(), id, request, ct));
}
