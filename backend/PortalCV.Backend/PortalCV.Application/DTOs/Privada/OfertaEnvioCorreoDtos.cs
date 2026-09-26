namespace PortalCV.Application.DTOs.Privada;

/// <summary>Borrador de correo redactado por IA -- no persiste nada, el usuario lo revisa
/// y edita antes de enviarlo (POST .../enviar-correo).</summary>
public record CorreoBorradorDto(string Asunto, string Cuerpo, bool PromptPorDefecto);

/// <summary>Valores finales (posiblemente editados por el usuario) para el envío real --
/// no vuelve a llamar a la IA.</summary>
public record EnviarCorreoRequest(string Destinatario, string Asunto, string Cuerpo);
