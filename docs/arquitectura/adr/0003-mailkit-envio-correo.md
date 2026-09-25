# ADR-0003: Envío de correo con MailKit en vez de librería SMTP nativa

## Estado

Aceptada.

## Contexto

`OfertaEnvioService` envía por correo al reclutador el CV generado, vía `IEmailSender` /
`MailKitEmailSender`, usando la configuración SMTP guardada por CV en `ConfiguracionCorreo`
(mismo patrón de secreto cifrado que `ProveedorIa`). Igual que en ADR-0002, la restricción
activa es la imagen de runtime mínima del backend (`mcr.microsoft.com/dotnet/aspnet:10.0`,
sin pasos `apt-get`, ver `CLAUDE.md`).

Para enviar correo SMTP desde .NET, las opciones típicas son:

- Una librería SMTP administrada (ej. MailKit), que implementa el protocolo SMTP en C# puro.
- Una librería con dependencias nativas del sistema operativo para el envío/parseo de correo.

## Decisión

Se usa **MailKit**, una librería completamente administrada (sin dependencias nativas), lo
cual es compatible con la imagen de runtime mínima sin requerir ningún cambio al Dockerfile.

## Alternativas consideradas

- **Librería con dependencias nativas del sistema para SMTP** — descartada: cualquier
  dependencia nativa fuerza agregar pasos `apt-get` al Dockerfile de runtime, rompiendo la
  restricción de imagen mínima ya decidida (la misma restricción que llevó a ADR-0002).
- **`System.Net.Mail.SmtpClient` (BCL)** — no evaluada como alternativa seria: está marcada
  obsoleta por Microsoft desde hace varias versiones de .NET, sin soporte activo de
  protocolos SMTP modernos (STARTTLS/OAuth2 robustos).

## Consecuencias

- La dirección de envío siempre es `Personales.Email` del CV — no hay un campo de login SMTP
  separado, lo cual es una simplificación deliberada del flujo, no una limitación de MailKit.
- Cualquier necesidad futura de una feature SMTP avanzada (ej. tracking de apertura, plantillas
  de correo transaccional de un proveedor externo tipo SendGrid/Mailgun) requeriría evaluar si
  seguir con MailKit + servidor SMTP propio, o migrar a una API HTTP de un proveedor
  transaccional (que también sería administrada, sin romper la restricción de imagen).

## Referencias

- `CLAUDE.md`, sección Docker.
- `CLAUDE.md`, sección "Flujo Oferta → Perfil → CV → correo".
