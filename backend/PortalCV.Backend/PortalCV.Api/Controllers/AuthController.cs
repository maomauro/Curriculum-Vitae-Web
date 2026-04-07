using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using PortalCV.Api.Contracts.Auth;

namespace PortalCV.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public AuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
    {
        var configuredEmail = _configuration["Auth:DemoUser:Email"];
        var configuredPassword = _configuration["Auth:DemoUser:Password"];

        if (string.IsNullOrWhiteSpace(configuredEmail) || string.IsNullOrWhiteSpace(configuredPassword))
        {
            return Problem(
                detail: "Configura Auth:DemoUser:Email y Auth:DemoUser:Password para habilitar login de pruebas.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        if (!string.Equals(request.Email, configuredEmail, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(request.Password, configuredPassword, StringComparison.Ordinal))
        {
            return Unauthorized(new { message = "Credenciales inválidas." });
        }

        var issuer = _configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer no está configurado.");
        var audience = _configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Jwt:Audience no está configurado.");
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key no está configurado.");

        var expires = DateTime.UtcNow.AddHours(2);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, request.Email),
            new Claim(JwtRegisteredClaimNames.Email, request.Email),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var signingCredentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expires,
            signingCredentials: signingCredentials);

        var token = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);

        return Ok(new LoginResponse
        {
            AccessToken = token,
            ExpiresIn = new DateTimeOffset(expires).ToUnixTimeSeconds()
        });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var email = User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? User.Identity?.Name;
        var role = User.FindFirstValue(ClaimTypes.Role);

        return Ok(new { email, role });
    }

    /// <summary>
    /// Recuperación de contraseña — fase 1: solicitar enlace de reset.
    /// En producción enviaría un email con token temporal; por ahora devuelve
    /// un mensaje genérico (no revela si el email existe).
    /// </summary>
    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public IActionResult ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        // Respuesta genérica por seguridad: no revelar si el email existe.
        return Ok(new { message = "Si el correo está registrado, recibirás las instrucciones en breve." });
    }
}
