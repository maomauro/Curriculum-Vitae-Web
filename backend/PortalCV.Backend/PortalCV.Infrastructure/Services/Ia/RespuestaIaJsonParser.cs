using System.Text.Json;
using PortalCV.Application.Constants;

namespace PortalCV.Infrastructure.Services;

/// <summary>Parsea la respuesta de texto de un proveedor de IA como JSON, compartido por
/// cualquier paso del flujo de Ofertas (extracción, selección de perfil, generación de
/// CV). La IA puede envolver el JSON en un bloque de código ```json ... ``` a pesar de
/// que el prompt pida "sin formato adicional" -- se limpia antes de parsear.</summary>
internal static class RespuestaIaJsonParser
{
    public static T Parsear<T>(string textoRespuesta)
    {
        var limpio = textoRespuesta.Trim();
        if (limpio.StartsWith("```"))
        {
            var primerSalto = limpio.IndexOf('\n');
            var ultimasComillas = limpio.LastIndexOf("```", StringComparison.Ordinal);
            if (primerSalto >= 0 && ultimasComillas > primerSalto)
                limpio = limpio[(primerSalto + 1)..ultimasComillas].Trim();
        }

        try
        {
            var resultado = JsonSerializer.Deserialize<T>(
                limpio, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return resultado ?? throw new ArgumentException(ApiMessages.Ia.RespuestaNoEsJsonValido);
        }
        catch (JsonException)
        {
            throw new ArgumentException(ApiMessages.Ia.RespuestaNoEsJsonValido);
        }
    }
}
