using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;

namespace PortalCV.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IRepository<Usuario> _usuarioRepo;
    private readonly IRepository<Rol> _rolRepo;
    private readonly IRepository<UsuarioRol> _usuarioRolRepo;

    public AdminController(
        IRepository<Usuario> usuarioRepo,
        IRepository<Rol> rolRepo,
        IRepository<UsuarioRol> usuarioRolRepo)
    {
        _usuarioRepo = usuarioRepo;
        _rolRepo = rolRepo;
        _usuarioRolRepo = usuarioRolRepo;
    }

    // â”€â”€ Usuarios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // â”€â”€ Roles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// <summary>Lista todos los roles del sistema.</summary>
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles(CancellationToken ct = default)
        => Ok(await _rolRepo.GetAllAsync(ct));

    /// <summary>Crea un nuevo rol.</summary>
    [HttpPost("roles")]
    public async Task<IActionResult> CreateRol([FromBody] UpsertRolRequest request, CancellationToken ct = default)
    {
        var rol = new Rol
        {
            NombreRol = request.NombreRol,
            Descripcion = request.Descripcion
        };
        await _rolRepo.AddAsync(rol, ct);
        await _rolRepo.SaveChangesAsync(ct);
        return Ok(rol);
    }

    /// <summary>Actualiza la descripción de un rol.</summary>
    [HttpPut("roles/{id:int}")]
    public async Task<IActionResult> UpdateRol(int id, [FromBody] UpsertRolRequest request, CancellationToken ct = default)
    {
        var rol = await _rolRepo.GetByIdAsync(id, ct);
        if (rol is null) return NotFound();

        rol.NombreRol = request.NombreRol;
        rol.Descripcion = request.Descripcion;
        _rolRepo.Update(rol);
        await _rolRepo.SaveChangesAsync(ct);
        return Ok(rol);
    }

    /// <summary>Asigna un rol a un usuario.</summary>
    [HttpPost("usuarios/{usuarioId:int}/roles/{rolId:int}")]
    public async Task<IActionResult> AsignarRol(int usuarioId, int rolId, CancellationToken ct = default)
    {
        var usuario = await _usuarioRepo.GetByIdAsync(usuarioId, ct);
        if (usuario is null) return NotFound(new { message = "Usuario no encontrado." });

        var rol = await _rolRepo.GetByIdAsync(rolId, ct);
        if (rol is null) return NotFound(new { message = "Rol no encontrado." });

        var existentes = await _usuarioRolRepo.FindAsync(
            ur => ur.UsuarioId == usuarioId && ur.RolId == rolId, ct);
        if (existentes.Count > 0)
            return Conflict(new { message = "El usuario ya tiene ese rol." });

        await _usuarioRolRepo.AddAsync(new UsuarioRol { UsuarioId = usuarioId, RolId = rolId }, ct);
        await _usuarioRolRepo.SaveChangesAsync(ct);
        return Ok(new { usuarioId, rolId });
    }

    /// <summary>Quita un rol de un usuario.</summary>
    [HttpDelete("usuarios/{usuarioId:int}/roles/{rolId:int}")]
    public async Task<IActionResult> QuitarRol(int usuarioId, int rolId, CancellationToken ct = default)
    {
        var asignaciones = await _usuarioRolRepo.FindAsync(
            ur => ur.UsuarioId == usuarioId && ur.RolId == rolId, ct);
        if (asignaciones.Count == 0) return NotFound();

        _usuarioRolRepo.Remove(asignaciones[0]);
        await _usuarioRolRepo.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record SetEstadoRequest(bool Activo);
public record UpsertRolRequest(string NombreRol, string? Descripcion);

