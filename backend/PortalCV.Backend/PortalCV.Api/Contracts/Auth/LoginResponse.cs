namespace PortalCV.Api.Contracts.Auth;

/// <summary>
/// Respuesta pública de /api/auth/login. A propósito NO incluye el JWT: el
/// token viaja únicamente como cookie HttpOnly (ver AuthController.SetAuthCookie)
/// para que no quede accesible desde JavaScript en el cliente.
/// </summary>
public record LoginResponse(
    int UsuarioId,
    string Email,
    string NombreCompleto,
    IEnumerable<string> Roles,
    int CurriculumId,
    DateTime Expiracion);
