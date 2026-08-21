using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/proveedor-ia")]
public class ProveedorIaController : CvControllerBase
{
    private readonly IProveedorIaService _service;

    public ProveedorIaController(IProveedorIaService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _service.ListarAsync(GetCurriculumId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CrearProveedorIaConfigRequest request, CancellationToken ct = default)
    {
        var result = await _service.CrearAsync(GetCurriculumId(), request, ct);
        return CreatedAtAction(nameof(GetAll), new { }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ActualizarProveedorIaConfigRequest request, CancellationToken ct = default)
        => Ok(await _service.ActualizarAsync(GetCurriculumId(), id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _service.EliminarAsync(GetCurriculumId(), id, ct);
        return NoContent();
    }

    [HttpPut("{id:int}/activar")]
    public async Task<IActionResult> Activar(int id, CancellationToken ct = default)
        => Ok(await _service.ActivarAsync(GetCurriculumId(), id, ct));

    [HttpPost("probar")]
    public async Task<IActionResult> Probar([FromBody] ProbarConexionIaRequest request, CancellationToken ct = default)
        => Ok(await _service.ProbarConexionAsync(request, ct));

    [HttpPost("{id:int}/probar")]
    public async Task<IActionResult> ProbarGuardada(int id, CancellationToken ct = default)
        => Ok(await _service.ProbarConexionGuardadaAsync(GetCurriculumId(), id, ct));
}
