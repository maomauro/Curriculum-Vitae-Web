using System.Net;
using System.Net.Http.Json;
using PortalCV.Application.Interfaces;

namespace PortalCV.Infrastructure.Services;

/// <summary>Prueba de conexión real contra la API de Gemini (Google AI Studio). Envía una
/// solicitud mínima (1 token de salida) solo para validar que la clave y el modelo
/// funcionan — no se usa para generar contenido real todavía (eso es Fase 2+).</summary>
public class GeminiAiProviderClient : IAiProviderClient
{
    private const string ModeloPorDefecto = "gemini-flash-latest";

    private readonly HttpClient _http;

    public string Proveedor => "gemini";

    public GeminiAiProviderClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<(bool Ok, string Mensaje)> ProbarConexionAsync(
        string? modelo, string? endpoint, string? apiKey, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return (false, "La clave de API es requerida.");

        var modeloFinal = string.IsNullOrWhiteSpace(modelo) ? ModeloPorDefecto : modelo.Trim();

        try
        {
            // La clave va como query param (?key=), no como header x-goog-api-key: es el
            // metodo mas ampliamente soportado por la API de Gemini para todo tipo de
            // clave -- algunas claves (segun como se hayan restringido en Google Cloud)
            // no se autentican via header y la API responde 404 "modelo no encontrado" en
            // vez de un error de autenticacion, para no confirmar que el modelo existe.
            var claveEscapada = Uri.EscapeDataString(apiKey);
            using var request = new HttpRequestMessage(
                HttpMethod.Post, $"v1beta/models/{modeloFinal}:generateContent?key={claveEscapada}");
            request.Content = JsonContent.Create(new
            {
                contents = new[] { new { parts = new[] { new { text = "ping" } } } },
                generationConfig = new { maxOutputTokens = 1 },
            });

            using var response = await _http.SendAsync(request, ct);

            if (response.IsSuccessStatusCode)
                return (true, "Conexión exitosa.");

            if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden)
                return (false, "La clave de API no es válida.");

            if (response.StatusCode == HttpStatusCode.NotFound)
                return (false, "El modelo indicado no existe. Verifica el nombre del modelo.");

            if (response.StatusCode == HttpStatusCode.BadRequest)
            {
                var cuerpo = await response.Content.ReadAsStringAsync(ct);
                if (cuerpo.Contains("API_KEY_INVALID", StringComparison.OrdinalIgnoreCase))
                    return (false, "La clave de API no es válida.");
                return (false, "El modelo indicado no existe o la solicitud no es válida. Verifica el nombre del modelo.");
            }

            return (false, $"El proveedor respondió con un error ({(int)response.StatusCode}).");
        }
        catch (TaskCanceledException)
        {
            return (false, "Tiempo de espera agotado al conectar con el proveedor.");
        }
        catch (HttpRequestException)
        {
            return (false, "No se pudo conectar con el proveedor.");
        }
    }
}
