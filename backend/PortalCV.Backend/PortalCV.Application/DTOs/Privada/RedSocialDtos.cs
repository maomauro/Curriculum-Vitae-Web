namespace PortalCV.Application.DTOs.Privada;

public record RedSocialDto(
    int RedSocialId,
    string NombreRed,
    string? LinkPublico,
    string? UsuarioContacto,
    bool MostrarEnCv);

public record UpsertRedSocialRequest(
    string NombreRed,
    string? LinkPublico,
    string? UsuarioContacto,
    bool? MostrarEnCv);

public sealed class UpdateRedSocialVisibilidadRequest
{
    public bool MostrarEnCv { get; set; }
}

