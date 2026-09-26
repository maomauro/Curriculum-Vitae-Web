namespace PortalCV.Application.Interfaces;

/// <summary>Pasos comunes a toda invocación real a la IA dentro del flujo de Ofertas
/// (extracción, selección de perfil, generación de CV): resolver el proveedor activo del
/// CV, descifrar su clave, resolver la versión activa del prompt pedido (o su contenido
/// por defecto si el CV no tiene una propia), sustituir marcadores y llamar al
/// proveedor. Cada paso del flujo (<c>IOfertaAnalisisService</c>,
/// <c>IPerfilSeleccionService</c>, <c>ICvGeneradoService</c>) solo aporta su Código de
/// prompt, sus marcadores y el parseo del JSON de salida que espera.</summary>
public interface IIaPromptInvoker
{
    /// <summary>Lanza <see cref="ArgumentException"/> con mensaje claro si no hay
    /// proveedor activo, el proveedor no tiene cliente real, o el proveedor falla.</summary>
    Task<(string TextoRespuesta, bool PromptPorDefecto)> InvocarAsync(
        int curriculumId,
        string codigoPrompt,
        string contenidoPromptPorDefecto,
        IReadOnlyDictionary<string, string> valores,
        byte[]? imagenBytes = null,
        string? imagenContentType = null,
        CancellationToken ct = default);
}
