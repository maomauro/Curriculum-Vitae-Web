using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalCV.Api.Contracts.Auth;
using PortalCV.Application.Constants;
using PortalCV.Application.Interfaces;
using AppDto = PortalCV.Application.DTOs.Auth;

namespace PortalCV.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>Inicia sesión y devuelve un JWT.</summary>
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken ct)
    {
        var appRequest = new AppDto.LoginRequest(request.Email, request.Password);
        var result = await _authService.LoginAsync(appRequest, ct);
        return Ok(result);
    }

    /// <summary>Registra un nuevo publicador y crea su curriculum vacío.</summary>
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        CancellationToken ct)
    {
        var appRequest = new AppDto.RegisterRequest(
            request.Email,
            request.Password,
            request.NombreCompleto);

        try
        {
            var result = await _authService.RegisterAsync(appRequest, ct);
            // routeValues debe coincidir con la acción (Me no tiene parámetros); el cuerpo va en el 3er argumento.
            return CreatedAtAction(nameof(Me), null, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Devuelve información del usuario autenticado.</summary>
    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var email        = User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? User.Identity?.Name;
        var roles        = User.FindAll(ClaimTypes.Role).Select(c => c.Value);
        var curriculumId = User.FindFirstValue("curriculum_id");

        return Ok(new { email, roles, curriculumId });
    }

    /// <summary>
    /// Recuperación de contraseña — solicitar enlace de reset.
    /// Respuesta genérica para no revelar si el email existe.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public IActionResult ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        return Ok(new { message = ApiMessages.Auth.ForgotPasswordRespuestaGenerica });
    }

    /// <summary>Cambia la contraseña del usuario autenticado (valida la actual).</summary>
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken ct)
    {
        // El handler JWT suele mapear "sub" → ClaimTypes.NameIdentifier; buscar ambos.
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrEmpty(idStr) || !int.TryParse(idStr, out var usuarioId))
            return Unauthorized();

        await _authService.ChangePasswordAsync(
            usuarioId,
            request.CurrentPassword ?? string.Empty,
            request.NewPassword ?? string.Empty,
            ct);

        return Ok(new { message = ApiMessages.Auth.ContraseñaActualizada });
    }
}
