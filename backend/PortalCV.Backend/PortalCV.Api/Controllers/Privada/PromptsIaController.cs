using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

/// <summary>
/// Prompts de IA del área privada: cada CV administra los suyos. Cada edición inserta una
/// versión nueva (no sobrescribe el contenido de una existente), así queda historial y se puede
/// reactivar una versión anterior.
/// </summary>
[Route("api/prompts-ia")]
public class PromptsIaController : CvControllerBase
{
    private readonly IPromptIaService _prompts;

    public PromptsIaController(IPromptIaService prompts)
    {
        _prompts = prompts;
    }

    /// <summary>Lista la versión activa de cada prompt del CV actual.</summary>
    [HttpGet]
    public async Task<IActionResult> GetPrompts(CancellationToken ct = default)
        => Ok(await _prompts.ListarAsync(GetCurriculumId(), ct));

    /// <summary>Historial de versiones de un Código del CV actual (más reciente primero).</summary>
    [HttpGet("{codigo}")]
    public async Task<IActionResult> GetVersiones(string codigo, CancellationToken ct = default)
        => Ok(await _prompts.ListarVersionesAsync(GetCurriculumId(), codigo, ct));

    /// <summary>Crea un prompt con Código nuevo (Version 1, activa de inmediato).</summary>
    [HttpPost]
    public async Task<IActionResult> CrearPrompt([FromBody] CrearPromptIaRequest request, CancellationToken ct = default)
        => Ok(await _prompts.CrearAsync(GetCurriculumId(), request, ct));

    /// <summary>Crea una nueva versión de un Código existente (desactiva la anterior; no la sobrescribe).</summary>
    [HttpPost("{codigo}/versiones")]
    public async Task<IActionResult> CrearVersion(
        string codigo, [FromBody] CrearVersionPromptIaRequest request, CancellationToken ct = default)
        => Ok(await _prompts.CrearVersionAsync(GetCurriculumId(), codigo, request, ct));

    /// <summary>Reactiva una versión anterior (rollback): no crea una fila nueva.</summary>
    [HttpPut("versiones/{promptIaId:int}/activar")]
    public async Task<IActionResult> ActivarVersion(int promptIaId, CancellationToken ct = default)
        => Ok(await _prompts.ActivarVersionAsync(GetCurriculumId(), promptIaId, ct));
}
