using System;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalCV.Application;
using PortalCV.Application.Constants;
using PortalCV.Application.DTOs.Admin;
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
    private readonly ICurriculumRepository _curriculumRepo;
    private readonly ICvEditorService _cvEditor;
    private readonly IAdminAuditoriaService _auditoria;
    private readonly ICvAuditoriaService _auditoriaCv;

    public AdminController(
        IRepository<Usuario> usuarioRepo,
        IRepository<Rol> rolRepo,
        IRepository<UsuarioRol> usuarioRolRepo,
        ICurriculumRepository curriculumRepo,
        ICvEditorService cvEditor,
        IAdminAuditoriaService auditoria,
        ICvAuditoriaService auditoriaCv)
    {
        _usuarioRepo = usuarioRepo;
        _rolRepo = rolRepo;
        _usuarioRolRepo = usuarioRolRepo;
        _curriculumRepo = curriculumRepo;
        _cvEditor = cvEditor;
        _auditoria = auditoria;
        _auditoriaCv = auditoriaCv;
    }

    private int? GetActorUsuarioId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(value, out var id) && id > 0 ? id : null;
    }

    /// <summary>Historial de acciones administrativas (paginado).</summary>
    [HttpGet("auditoria")]
    public async Task<IActionResult> GetAuditoria(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? accion = null,
        [FromQuery] string? q = null,
        CancellationToken ct = default)
    {
        var (p, ps) = ClampAuditoriaPaging(page, pageSize);
        var (items, total) = await _auditoria.ListarAsync(p, ps, accion, q, ct);
        return Ok(AuditoriaPagedResult(items, total, p, ps));
    }

    /// <summary>Historial global de ediciones de CV (paginado, solo Admin).</summary>
    [HttpGet("auditoria-cv")]
    public async Task<IActionResult> GetAuditoriaCv(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? accion = null,
        [FromQuery] string? q = null,
        CancellationToken ct = default)
    {
        var (p, ps) = ClampAuditoriaPaging(page, pageSize);
        var (items, total) = await _auditoriaCv.ListarGlobalAsync(p, ps, accion, q, ct);
        return Ok(AuditoriaPagedResult(items, total, p, ps));
    }

    /// <summary>Elimina filas de auditoría por año/mes o vacía la tabla (con frase de confirmación).</summary>
    [HttpPost("auditoria/purge")]
    public async Task<ActionResult<PurgeAuditoriaResponseDto>> PurgeAuditoria(
        [FromBody] PurgeAuditoriaRequestDto? body,
        CancellationToken ct = default)
    {
        if (body is null)
            return BadRequest(new { message = ApiMessages.Admin.AuditoriaPurgeParametrosInvalidos });

        var tabla = body.Tabla?.Trim().ToLowerInvariant();
        if (tabla is not ("admin" or "cv"))
            return BadRequest(new { message = ApiMessages.Admin.AuditoriaPurgeTablaInvalida });

        if (!TryParsePurgeModo(body.Modo, out var modo))
            return BadRequest(new { message = ApiMessages.Admin.AuditoriaPurgeModoInvalido });

        if (modo == AuditoriaPurgeModo.Todo)
        {
            if (!string.Equals(body.Confirmacion?.Trim(), AuditoriaPurgeConfirmacion.VaciarTodo, StringComparison.Ordinal))
                return BadRequest(new { message = ApiMessages.Admin.AuditoriaPurgeConfirmacionInvalida });
        }

        try
        {
            var n = tabla == "admin"
                ? await _auditoria.PurgeAsync(modo, body.Anio, body.Mes, ct)
                : await _auditoriaCv.PurgeAsync(modo, body.Anio, body.Mes, ct);
            return Ok(new PurgeAuditoriaResponseDto { Eliminados = n });
        }
        catch (ArgumentException)
        {
            return BadRequest(new { message = ApiMessages.Admin.AuditoriaPurgeParametrosInvalidos });
        }
    }

    /// <summary>Lista todos los usuarios con sus roles asignados (sin info sensible).</summary>
    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios(CancellationToken ct = default)
    {
        var usuarios = await _usuarioRepo.GetAllAsync(ct);
        var usuarioRoles = await _usuarioRolRepo.GetAllAsync(ct);
        var roles = await _rolRepo.GetAllAsync(ct);

        var rolesDict = roles.ToDictionary(r => r.RolId);
        var usuarioRolesLookup = usuarioRoles.ToLookup(ur => ur.UsuarioId);
        var usuarioIds = usuarios.Select(u => u.UsuarioId).ToList();
        var cvPublicadoPorUser = await _curriculumRepo.GetCvPublicadoPorUsuarioIdsAsync(usuarioIds, ct);

        var dtos = usuarios.Select(u => new UsuarioAdminDto
        {
            UsuarioId = u.UsuarioId,
            Email = u.Email,
            Estado = u.Estado,
            FechaRegistro = u.FechaRegistro,
            CvPublicado = cvPublicadoPorUser.GetValueOrDefault(u.UsuarioId, false),
            Roles = usuarioRolesLookup[u.UsuarioId]
                .Where(ur => rolesDict.ContainsKey(ur.RolId))
                .Select(ur => new RolDto
                {
                    RolId = ur.RolId,
                    NombreRol = rolesDict[ur.RolId].NombreRol,
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
        if (usuario is null) return NotFound(new { message = ApiMessages.Admin.UsuarioNoEncontrado });

        var estadoAnterior = usuario.Estado;
        usuario.Estado = request.Activo ? "Activo" : "Inactivo";
        _usuarioRepo.Update(usuario);
        await _usuarioRepo.SaveChangesAsync(ct);

        await _auditoria.RegistrarAsync(
            GetActorUsuarioId(),
            AdminAuditoriaAcciones.UsuarioEstado,
            "Usuario",
            id,
            new Dictionary<string, string>
            {
                ["emailAfectado"] = usuario.Email,
                ["estadoAnterior"] = estadoAnterior,
                ["estadoNuevo"] = usuario.Estado
            },
            ct);

        return Ok(new { usuario.UsuarioId, usuario.Estado });
    }

    /// <summary>Publica u oculta el CV del usuario en el portal (misma lógica que Mi CV / presentación).</summary>
    [HttpPut("usuarios/{id:int}/cv-publicacion")]
    public async Task<IActionResult> SetCvPublicacion(
        int id,
        [FromBody] SetCvPublicacionRequest request,
        CancellationToken ct = default)
    {
        var usuario = await _usuarioRepo.GetByIdAsync(id, ct);
        if (usuario is null) return NotFound(new { message = ApiMessages.Admin.UsuarioNoEncontrado });

        var curriculum = await _curriculumRepo.GetByUsuarioIdAsync(id, ct);
        if (curriculum is null)
            return NotFound(new { message = ApiMessages.Admin.CurriculumNoEncontradoParaUsuario });

        var publicadoAntes = CurriculumEstados.EsPublicado(curriculum.Estado);
        var dto = await _cvEditor.UpdateCurriculumPublicacionAsync(curriculum.CurriculumId, request.Publicado, ct);

        await _auditoria.RegistrarAsync(
            GetActorUsuarioId(),
            AdminAuditoriaAcciones.UsuarioCvPublicacion,
            "Usuario",
            id,
            new Dictionary<string, string>
            {
                ["emailAfectado"] = usuario.Email,
                ["curriculumId"] = curriculum.CurriculumId.ToString(),
                ["publicadoAntes"] = publicadoAntes ? "true" : "false",
                ["publicadoDespues"] = dto.Publicado ? "true" : "false"
            },
            ct);

        return Ok(new { usuarioId = id, cvPublicado = dto.Publicado });
    }

    /// <summary>Lista todos los roles del sistema.</summary>
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles(CancellationToken ct = default)
    {
        var roles = await _rolRepo.GetAllAsync(ct);
        return Ok(roles.Select(r => new RolDto
        {
            RolId = r.RolId,
            NombreRol = r.NombreRol,
            Descripcion = r.Descripcion
        }));
    }

    /// <summary>Asigna un rol a un usuario.</summary>
    [HttpPost("usuarios/{usuarioId:int}/roles/{rolId:int}")]
    public async Task<IActionResult> AsignarRol(int usuarioId, int rolId, CancellationToken ct = default)
    {
        var usuario = await _usuarioRepo.GetByIdAsync(usuarioId, ct);
        if (usuario is null) return NotFound(new { message = ApiMessages.Admin.UsuarioNoEncontrado });

        var rol = await _rolRepo.GetByIdAsync(rolId, ct);
        if (rol is null) return NotFound(new { message = ApiMessages.Admin.RolNoEncontrado });

        var existentes = await _usuarioRolRepo.FindAsync(
            ur => ur.UsuarioId == usuarioId && ur.RolId == rolId, ct);
        if (existentes.Count > 0)
            return Conflict(new { message = ApiMessages.Admin.UsuarioYaTieneEseRol });

        await _usuarioRolRepo.AddAsync(new UsuarioRol { UsuarioId = usuarioId, RolId = rolId }, ct);
        await _usuarioRolRepo.SaveChangesAsync(ct);

        await _auditoria.RegistrarAsync(
            GetActorUsuarioId(),
            AdminAuditoriaAcciones.UsuarioRolAsignado,
            "Usuario",
            usuarioId,
            new Dictionary<string, string>
            {
                ["emailAfectado"] = usuario.Email,
                ["rolId"] = rolId.ToString(),
                ["nombreRol"] = rol.NombreRol
            },
            ct);

        return Ok(new { usuarioId, rolId, nombreRol = rol.NombreRol });
    }

    /// <summary>Quita un rol de un usuario. Protege que siempre quede al menos un Admin.</summary>
    [HttpDelete("usuarios/{usuarioId:int}/roles/{rolId:int}")]
    public async Task<IActionResult> QuitarRol(int usuarioId, int rolId, CancellationToken ct = default)
    {
        var asignaciones = await _usuarioRolRepo.FindAsync(
            ur => ur.UsuarioId == usuarioId && ur.RolId == rolId, ct);
        if (asignaciones.Count == 0) return NotFound();

        var rolObj = await _rolRepo.GetByIdAsync(rolId, ct);
        if (rolObj?.NombreRol.Equals("Admin", StringComparison.OrdinalIgnoreCase) == true)
        {
            var otrosAdmins = await _usuarioRolRepo.FindAsync(
                ur => ur.RolId == rolId && ur.UsuarioId != usuarioId, ct);
            if (otrosAdmins.Count == 0)
                return BadRequest(new { message = ApiMessages.Admin.DebeQuedarAlMenosUnAdmin });
        }

        var usuario = await _usuarioRepo.GetByIdAsync(usuarioId, ct);
        var nombreRol = rolObj?.NombreRol ?? rolId.ToString();

        _usuarioRolRepo.Remove(asignaciones[0]);
        await _usuarioRolRepo.SaveChangesAsync(ct);

        if (usuario is not null)
        {
            await _auditoria.RegistrarAsync(
                GetActorUsuarioId(),
                AdminAuditoriaAcciones.UsuarioRolQuitado,
                "Usuario",
                usuarioId,
                new Dictionary<string, string>
                {
                    ["emailAfectado"] = usuario.Email,
                    ["rolId"] = rolId.ToString(),
                    ["nombreRol"] = nombreRol
                },
                ct);
        }

        return NoContent();
    }

    private static bool TryParsePurgeModo(string? s, out AuditoriaPurgeModo modo)
    {
        modo = default;
        if (string.IsNullOrWhiteSpace(s))
            return false;
        switch (s.Trim().ToLowerInvariant())
        {
            case "aniomes":
                modo = AuditoriaPurgeModo.AnioMes;
                return true;
            case "anio":
                modo = AuditoriaPurgeModo.Anio;
                return true;
            case "todo":
                modo = AuditoriaPurgeModo.Todo;
                return true;
            default:
                return false;
        }
    }

    private static (int Page, int PageSize) ClampAuditoriaPaging(int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize is < 1 or > 100) pageSize = 10;
        return (page, pageSize);
    }

    private static object AuditoriaPagedResult<T>(IReadOnlyList<T> items, int total, int page, int pageSize) =>
        new
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = total == 0 ? 1 : (int)Math.Ceiling((double)total / pageSize)
        };
}

public record SetEstadoRequest(bool Activo);

public record SetCvPublicacionRequest(bool Publicado);
