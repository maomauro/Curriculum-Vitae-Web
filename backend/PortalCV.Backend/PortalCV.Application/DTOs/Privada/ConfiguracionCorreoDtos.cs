namespace PortalCV.Application.DTOs.Privada;

/// <summary>Nunca incluye la contraseña -- ni cifrada ni en texto plano. El remitente no
/// viaja acá: siempre es Personales.Email en el momento de enviar.</summary>
public record ConfiguracionCorreoDto(
    int ConfiguracionCorreoId,
    string Host,
    int Puerto,
    bool UsarTls,
    bool TieneConfiguracion,
    DateTime? FechaActualizacion);

/// <summary>Password null/vacío en una actualización significa "no cambiar la contraseña
/// guardada" (nunca se devuelve al front-end, así que no hay forma de reenviarla salvo
/// que el usuario decida cambiarla).</summary>
public record GuardarConfiguracionCorreoRequest(
    string Host,
    int Puerto,
    bool UsarTls,
    string? Password);
