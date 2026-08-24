using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PortalCV.Application.Interfaces;

namespace PortalCV.Infrastructure.Services;

/// <summary>Prueba de conexión real contra la API de Groq (chat completions, compatible
/// con el formato de OpenAI). Envía una solicitud mínima (1 token de salida) solo para
/// validar que la clave y el modelo funcionan.</summary>
public class GroqAiProviderClient : IAiProviderClient
{
    private const string ModeloPorDefecto = "openai/gpt-oss-120b";

    private readonly HttpClient _http;

    public string Proveedor => "groq";

    public GroqAiProviderClient(HttpClient http)
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
            using var request = new HttpRequestMessage(HttpMethod.Post, "openai/v1/chat/completions");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = JsonContent.Create(new
            {
                model = modeloFinal,
                max_tokens = 1,
                messages = new[] { new { role = "user", content = "ping" } },
            });

            using var response = await _http.SendAsync(request, ct);

            if (response.IsSuccessStatusCode)
                return (true, "Conexión exitosa.");

            if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden)
                return (false, "La clave de API no es válida.");

            if (response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest)
                return (false, "El modelo indicado no existe o la solicitud no es válida. Verifica el nombre del modelo.");

            if (response.StatusCode == HttpStatusCode.TooManyRequests)
                return (false, "Se alcanzó el límite de solicitudes de tu cuenta Groq. Intenta de nuevo en unos minutos.");

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

    public async Task<(bool Ok, string? Texto, string? Error)> GenerarTextoAsync(
        string? modelo, string? endpoint, string? apiKey, string prompt,
        byte[]? imagenBytes, string? imagenContentType, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return (false, null, "La clave de API es requerida.");

        var modeloFinal = string.IsNullOrWhiteSpace(modelo) ? ModeloPorDefecto : modelo.Trim();

        // Formato de mensajes compatible con OpenAI: si hay imagen, el contenido es una
        // lista de partes (texto + image_url en base64); si no, un string simple.
        object contenidoMensaje;
        if (imagenBytes is { Length: > 0 } && !string.IsNullOrWhiteSpace(imagenContentType))
        {
            contenidoMensaje = new object[]
            {
                new { type = "text", text = prompt },
                new
                {
                    type = "image_url",
                    image_url = new { url = $"data:{imagenContentType};base64,{Convert.ToBase64String(imagenBytes)}" },
                },
            };
        }
        else
        {
            contenidoMensaje = prompt;
        }

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "openai/v1/chat/completions");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = JsonContent.Create(new
            {
                model = modeloFinal,
                max_tokens = 4096,
                messages = new[] { new { role = "user", content = contenidoMensaje } },
            });

            using var response = await _http.SendAsync(request, ct);

            if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden)
                return (false, null, "La clave de API no es válida.");
            if (response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest)
                return (false, null, "El modelo indicado no existe o la solicitud no es válida. Verifica el nombre del modelo.");
            if (response.StatusCode == HttpStatusCode.TooManyRequests)
                return (false, null, "Se alcanzó el límite de solicitudes de tu cuenta Groq. Intenta de nuevo en unos minutos.");
            if (!response.IsSuccessStatusCode)
                return (false, null, $"El proveedor respondió con un error ({(int)response.StatusCode}).");

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
            var texto = doc.RootElement.GetProperty("choices")[0]
                .GetProperty("message").GetProperty("content").GetString();
            return string.IsNullOrWhiteSpace(texto)
                ? (false, null, "El proveedor respondió sin contenido de texto.")
                : (true, texto, null);
        }
        catch (TaskCanceledException)
        {
            return (false, null, "Tiempo de espera agotado al conectar con el proveedor.");
        }
        catch (HttpRequestException)
        {
            return (false, null, "No se pudo conectar con el proveedor.");
        }
        catch (Exception ex) when (ex is JsonException or KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException)
        {
            return (false, null, "El proveedor respondió, pero no con el formato esperado.");
        }
    }
}
