namespace PortalCV.Domain.Entities;

/// <summary>Configuración SMTP para enviar correos a reclutadores (ver flujo de Analizar
/// Oferta → Enviar correo). Una por Curriculum -- el remitente/login SMTP es siempre el
/// correo que ya está en Personales.Email, no se guarda un usuario aparte. La contraseña
/// se cifra con el mismo IApiKeyCipher que usan las conexiones de IA y nunca se devuelve
/// al front-end.</summary>
public class ConfiguracionCorreo
{
    public int ConfiguracionCorreoId { get; set; }
    public int CurriculumId { get; set; }
    public string Host { get; set; } = "smtp.gmail.com";
    public int Puerto { get; set; } = 587;
    public bool UsarTls { get; set; } = true;
    public string? PasswordCifrada { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaActualizacion { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
}
