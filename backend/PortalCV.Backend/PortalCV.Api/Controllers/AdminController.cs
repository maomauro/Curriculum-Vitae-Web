using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IRepository<PortalCV.Domain.Entities.Usuario> _usuarioRepo;

    public AdminController(IRepository<PortalCV.Domain.Entities.Usuario> usuarioRepo)
    {
        _usuarioRepo = usuarioRepo;
    }

    /// <summary>Lista todos los usuarios registrados.</summary>
    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios(CancellationToken ct = default)
        => Ok(await _usuarioRepo.GetAllAsync(ct));

    /// <summary>Activa o desactiva un usuario.</summary>
    [HttpPut("usuarios/{id:int}/estado")]
    public async Task<IActionResult> SetEstado(int id, [FromBody] SetEstadoRequest request, CancellationToken ct = default)
    {
        var usuario = await _usuarioRepo.GetByIdAsync(id, ct);
        if (usuario is null) return NotFound();

        usuario.Estado = request.Activo ? "Activo" : "Inactivo";
        _usuarioRepo.Update(usuario);
        await _usuarioRepo.SaveChangesAsync(ct);

        return Ok(new { usuario.UsuarioId, usuario.Estado });
    }
}

public record SetEstadoRequest(bool Activo);
