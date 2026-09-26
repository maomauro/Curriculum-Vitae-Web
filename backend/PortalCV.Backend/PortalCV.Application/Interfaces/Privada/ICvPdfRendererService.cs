using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

/// <summary>Genera el PDF que se adjunta al correo enviado a un reclutador (ver
/// IOfertaEnvioService). Es una plantilla propia, única y sobria -- no intenta igualar
/// ninguna de las 5 plantillas de color que el usuario ve en pantalla (Mi CV/
/// Profesional); esas viven solo en Angular, y reproducirlas acá otra vez repetiría el
/// mismo costo de mantenimiento que ya tuvimos que pagar una vez entre Profesional y
/// Mi CV. Los datos de contacto vienen siempre de Personales, nunca de la IA.</summary>
public interface ICvPdfRendererService
{
    byte[] Renderar(PersonalesDto personales, PerfilDto perfil, ContenidoCvGeneradoDto contenido);
}
