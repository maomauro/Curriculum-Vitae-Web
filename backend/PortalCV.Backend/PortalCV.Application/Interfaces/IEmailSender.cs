namespace PortalCV.Application.Interfaces;

public record EmailAdjunto(string NombreArchivo, byte[] Bytes, string ContentType);

public record EmailEnvioRequest(
    string Host,
    int Puerto,
    bool UsarTls,
    string RemitenteEmail,
    string? RemitenteNombre,
    string PasswordSmtp,
    string DestinatarioEmail,
    string? DestinatarioNombre,
    string Asunto,
    string CuerpoTexto,
    IReadOnlyList<EmailAdjunto> Adjuntos);

/// <summary>Envío de correo saliente (ver flujo de Analizar Oferta -> Enviar correo). El
/// remitente/login SMTP es siempre el correo del propio candidato (Personales.Email),
/// nunca una cuenta compartida de la app.</summary>
public interface IEmailSender
{
    Task<(bool Ok, string? Error)> EnviarAsync(EmailEnvioRequest request, CancellationToken ct = default);
}
