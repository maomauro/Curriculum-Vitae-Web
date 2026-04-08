namespace PortalCV.Application.DTOs.Curriculum;

public record RedSocialDto(
    int RedSocialId,
    string NombreRed,
    string? LinkPublico,
    string? UsuarioContacto);

public record UpsertRedSocialRequest(
    string NombreRed,
    string? LinkPublico,
    string? UsuarioContacto);
