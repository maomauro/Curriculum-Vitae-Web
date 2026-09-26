using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

/// <summary>Reemplaza al viejo "generar un CV nuevo con IA para esta oferta"
/// (CvGeneradoService, retirado): ahora la oferta usa el CV que el usuario ya construyó
/// para el Perfil asignado (CvGenerado) y lo envía por correo al reclutador con el
/// CV adjunto en PDF. El remitente es siempre Personales.Email.</summary>
public interface IOfertaEnvioService
{
    /// <summary>Redacta con IA el asunto/cuerpo del correo -- no persiste nada ni envía
    /// nada, el usuario lo revisa/edita antes de POST .../enviar-correo.</summary>
    Task<CorreoBorradorDto> RedactarAsync(int curriculumId, int ofertaId, CancellationToken ct = default);

    /// <summary>Envía el correo real (valores ya revisados/editados por el usuario, no
    /// vuelve a llamar a la IA) con el CV del Perfil asignado adjunto en PDF. Requiere que
    /// la Oferta tenga un Perfil asignado, que ese Perfil ya tenga un CvGenerado
    /// generado, y que el CV tenga ConfiguracionCorreo guardada -- si falta algo, lanza un
    /// error claro señalando dónde resolverlo (Mi CV o Configuración). Si el envío falla,
    /// no cambia el Estado de la Oferta (permite reintentar).</summary>
    Task<OfertaDto> EnviarAsync(int curriculumId, int ofertaId, EnviarCorreoRequest request, CancellationToken ct = default);
}
