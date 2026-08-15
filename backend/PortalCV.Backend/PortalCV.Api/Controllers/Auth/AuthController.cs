using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PortalCV.Api.Contracts.Auth;
using PortalCV.Application.Constants;
using PortalCV.Application.Interfaces;
using AppDto = PortalCV.Application.DTOs.Auth;

namespace PortalCV.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _environment;

    public AuthController(IAuthService authService, IWebHostEnvironment environment)
    {
        _authService = authService;
        _environment = environment;
    }

    /// <summary>Inicia sesión y deja el JWT en una cookie HttpOnly (no viaja en el body).</summary>
    [AllowAnonymous]
    [EnableRateLimiting("auth-public")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken ct)
    {
        var appRequest = new AppDto.LoginRequest(request.Email, request.Password);
        var result = await _authService.LoginAsync(appRequest, ct);

        SetAuthCookie(result.Token, result.Expiracion);

        var response = new LoginResponse(
            result.UsuarioId,
            result.Email,
            result.NombreCompleto,
            result.Roles,
            result.CurriculumId,
            result.Expiracion);

        return Ok(response);
    }

    /// <summary>Cierra la sesión borrando la cookie del JWT. Anónimo: debe funcionar incluso si el token ya venció.</summary>
    [AllowAnonymous]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(AuthCookieDefaults.Name, BuildCookieOptions(DateTimeOffset.UnixEpoch));
        return Ok(new { message = ApiMessages.Auth.SesionCerrada });
    }

    /// <summary>Registra un nuevo publicador y crea su curriculum vacío.</summary>
    [AllowAnonymous]
    [EnableRateLimiting("auth-public")]
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

    /// <summary>
    /// Devuelve información del usuario autenticado. El frontend la usa para restaurar
    /// la sesión al recargar la página, ya que el JWT vive en una cookie HttpOnly que
    /// JavaScript no puede leer ni decodificar directamente.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        // El JwtBearerHandler remapea claims JWT cortos a los URI largos de ClaimTypes
        // (sub -> NameIdentifier, email -> ClaimTypes.Email) via su inbound claim map por
        // defecto: hay que buscar ambas formas, igual que ya hace CvControllerBase con "sub".
        var idStr        = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var email        = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? User.Identity?.Name;
        var nombre       = User.FindFirstValue("nombre");
        var roles        = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        var curriculumId = User.FindFirstValue("curriculum_id");

        return Ok(new AppDto.UserMeResponse(
            int.TryParse(idStr, out var usuarioId) ? usuarioId : 0,
            email ?? string.Empty,
            nombre ?? email ?? string.Empty,
            roles,
            int.TryParse(curriculumId, out var id) ? id : null
        ));
    }

    /// <summary>
    /// Recuperación de contraseña — solicitar enlace de reset.
    /// Respuesta genérica para no revelar si el email existe.
    /// </summary>
    [AllowAnonymous]
    [EnableRateLimiting("auth-public")]
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

    // ──────────────────────────────────────────────────────────────────────────
    // Cookie del JWT
    // ──────────────────────────────────────────────────────────────────────────

    private void SetAuthCookie(string token, DateTime expiracion)
        => Response.Cookies.Append(AuthCookieDefaults.Name, token, BuildCookieOptions(expiracion));

    /// <summary>
    /// SameSite=None + Secure es obligatorio en producción porque el SPA (Static Web Apps)
    /// y la API (Container Apps) viven en dominios distintos — es una cookie cross-site.
    /// En Development se usa Lax/no-Secure porque ng serve la sirve por HTTP a través del
    /// proxy (mismo origen aparente); un navegador descarta SameSite=None sin Secure.
    /// </summary>
    private CookieOptions BuildCookieOptions(DateTime expiracion) => BuildCookieOptions(new DateTimeOffset(expiracion, TimeSpan.Zero));

    private CookieOptions BuildCookieOptions(DateTimeOffset expiracion) => new()
    {
        HttpOnly = true,
        Secure = !_environment.IsDevelopment(),
        SameSite = _environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None,
        Expires = expiracion,
        Path = "/"
    };
}
