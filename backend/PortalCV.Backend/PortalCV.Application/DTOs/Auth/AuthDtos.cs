namespace PortalCV.Application.DTOs.Auth;

public record LoginRequest(string Email, string Password);

public record LoginResponse(
    string Token,
    int UsuarioId,
    string Email,
    string NombreCompleto,
    IEnumerable<string> Roles,
    int CurriculumId,
    DateTime Expiracion);

public record RegisterRequest(
    string Email,
    string Password,
    string NombreCompleto);

public record RegisterResponse(
    int UsuarioId,
    string Email,
    string NombreCompleto);
