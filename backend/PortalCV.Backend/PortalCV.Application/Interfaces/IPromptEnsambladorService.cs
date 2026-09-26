namespace PortalCV.Application.Interfaces;

/// <summary>Sustituye los marcadores <c>{{MARCADOR}}</c> del contenido ya ensamblado de un
/// <c>PromptIa</c> (ver <see cref="IPromptIaService"/>) por sus valores reales antes de
/// enviarlo a un proveedor de IA. Los nombres de marcador los define el sistema por
/// Código de prompt (p. ej. <c>{{OFERTA_TEXTO}}</c> para <c>EXTRACTOR_OFERTA</c>) — el
/// usuario solo edita el texto alrededor.</summary>
public interface IPromptEnsambladorService
{
    /// <summary>Reemplaza cada <c>{{MARCADOR}}</c> presente en <paramref name="valores"/>.
    /// Si al terminar queda algún <c>{{...}}</c> sin resolver, lanza
    /// <see cref="ArgumentException"/> con un mensaje que nombra el marcador desconocido,
    /// en vez de mandarle a la IA un prompt roto.</summary>
    string Ensamblar(string contenido, IReadOnlyDictionary<string, string> valores);
}
