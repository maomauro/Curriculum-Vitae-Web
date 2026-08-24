using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using PortalCV.Application.Interfaces;

namespace PortalCV.Infrastructure.Services.Email;

public class MailKitEmailSender : IEmailSender
{
    public async Task<(bool Ok, string? Error)> EnviarAsync(EmailEnvioRequest request, CancellationToken ct = default)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(request.RemitenteNombre ?? request.RemitenteEmail, request.RemitenteEmail));
            message.To.Add(new MailboxAddress(request.DestinatarioNombre ?? request.DestinatarioEmail, request.DestinatarioEmail));
            message.Subject = request.Asunto;

            var builder = new BodyBuilder { TextBody = request.CuerpoTexto };
            foreach (var adjunto in request.Adjuntos)
                builder.Attachments.Add(adjunto.NombreArchivo, adjunto.Bytes, ContentType.Parse(adjunto.ContentType));
            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            var opciones = request.UsarTls ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;
            await client.ConnectAsync(request.Host, request.Puerto, opciones, ct);
            await client.AuthenticateAsync(request.RemitenteEmail, request.PasswordSmtp, ct);
            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);

            return (true, null);
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }
}
