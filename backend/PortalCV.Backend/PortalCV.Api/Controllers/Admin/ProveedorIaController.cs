using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Admin;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/proveedor-ia")]
public class ProveedorIaController : ControllerBase
{
    private readonly IProveedorIaService _service;

    public ProveedorIaController(IProveedorIaService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
        => Ok(await _service.ListarAsync(ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CrearProveedorIaRequest request, CancellationToken ct = default)
    {
        var result = await _service.CrearAsync(request, ct);
        return CreatedAtAction(nameof(GetAll), new { }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ActualizarProveedorIaRequest request, CancellationToken ct = default)
        => Ok(await _service.ActualizarAsync(id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _service.EliminarAsync(id, ct);
        return NoContent();
    }

    [HttpPut("{id:int}/activar")]
    public async Task<IActionResult> Activar(int id, CancellationToken ct = default)
        => Ok(await _service.ActivarAsync(id, ct));

    [HttpPost("probar")]
    public async Task<IActionResult> Probar([FromBody] ProbarConexionIaRequest request, CancellationToken ct = default)
        => Ok(await _service.ProbarConexionAsync(request, ct));

    [HttpPost("{id:int}/probar")]
    public async Task<IActionResult> ProbarGuardada(int id, CancellationToken ct = default)
        => Ok(await _service.ProbarConexionGuardadaAsync(id, ct));
}
