using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Admin;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;

namespace PortalCV.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IRepository<Usuario>    _usuarioRepo;
    private readonly IRepository<Rol>        _rolRepo;
    private readonly IRepository<UsuarioRol> _usuarioRolRepo;

    public AdminController(
        IRepository<Usuario>    usuarioRepo,
        IRepository<Rol>        rolRepo,
        IRepository<UsuarioRol> usuarioRolRepo)
    {
        _usuarioRepo    = usuarioRepo;
        _rolRepo        = rolRepo;
        _usuarioRolRepo = usuarioRolRepo;
    }

    // ── Usuarios ─────────────────────────────────────────────────────────

    /// <summary>Lista todos los usuarios con sus roles asignados (sin info sensible).</summary>
    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios(CancellationToken ct = default)
    {
        var usuarios     = await _usuarioRepo.GetAllAsync(ct);
        var usuarioRoles = await _usuarioRolRepo.GetAllAsync(ct);
        var roles        = await _rolRepo.GetAllAsync(ct);

        var rolesDict          = roles.ToDictionary(r => r.RolId);
        var usuarioRolesLookup = usuarioRoles.ToLookup(ur => ur.UsuarioId);

        var dtos = usuarios.Select(u => new UsuarioAdminDto
        {
            UsuarioId     = u.UsuarioId,
            Email         = u.Email,
            Estado        = u.Estado,
            FechaRegistro = u.FechaRegistro,
            Roles         = usuarioRolesLookup[u.UsuarioId]
                .Where(ur => rolesDict.ContainsKey(ur.RolId))
                .Select(ur => new RolDto
                {
                    RolId      = ur.RolId,
                    NombreRol  = rolesDict[ur.RolId].NombreRol,
                    Descripcion = rolesDict[ur.RolId].Descripcion
                }).ToList()
        });

        return Ok(dtos);
    }

    /// <summary>Activa o desactiva un usuario.</summary>
    [HttpPut("usuarios/{id:int}/estado")]
    public async Task<IActionResult> SetEstado(int id, [FromBody] SetEstadoRequest request, CancellationToken ct = default)
    {
        var usuario = await _usuarioRepo.GetByIdAsync(id, ct);
        if (usuario is null) return NotFound(new { message = "Usuario no encontrado." });

        usuario.Estado = request.Activo ? "Activo" : "Inactivo";
        _usuarioRepo.Update(usuario);
        await _usuarioRepo.SaveChangesAsync(ct);

        return Ok(new { usuario.UsuarioId, usuario.Estado });
    }

    // ── Roles ─────────────────────────────────────────────────────────────

    /// <summary>Lista todos los roles del sistema.</summary>
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles(CancellationToken ct = default)
    {
        var roles = await _rolRepo.GetAllAsync(ct);
        return Ok(roles.Select(r => new RolDto
        {
            RolId       = r.RolId,
            NombreRol   = r.NombreRol,
            Descripcion = r.Descripcion
        }));
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
        return Ok(new { usuarioId, rolId, nombreRol = rol.NombreRol });
    }

    /// <summary>Quita un rol de un usuario. Protege que siempre quede al menos un Admin.</summary>
    [HttpDelete("usuarios/{usuarioId:int}/roles/{rolId:int}")]
    public async Task<IActionResult> QuitarRol(int usuarioId, int rolId, CancellationToken ct = default)
    {
        var asignaciones = await _usuarioRolRepo.FindAsync(
            ur => ur.UsuarioId == usuarioId && ur.RolId == rolId, ct);
        if (asignaciones.Count == 0) return NotFound();

        // Salvaguarda: debe quedar al menos otro usuario con rol Admin
        var rolObj = await _rolRepo.GetByIdAsync(rolId, ct);
        if (rolObj?.NombreRol.Equals("Admin", StringComparison.OrdinalIgnoreCase) == true)
        {
            var otrosAdmins = await _usuarioRolRepo.FindAsync(
                ur => ur.RolId == rolId && ur.UsuarioId != usuarioId, ct);
            if (otrosAdmins.Count == 0)
                return BadRequest(new { message = "Debe quedar al menos un usuario con rol Admin." });
        }

        _usuarioRolRepo.Remove(asignaciones[0]);
        await _usuarioRolRepo.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record SetEstadoRequest(bool Activo);

