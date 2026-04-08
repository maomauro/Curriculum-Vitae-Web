namespace PortalCV.Application.DTOs.Privada;

public record RedSocialDto(
    int RedSocialId,
    string NombreRed,
    string? LinkPublico,
    string? UsuarioContacto);

public record UpsertRedSocialRequest(
    string NombreRed,
    string? LinkPublico,
    string? UsuarioContacto);

