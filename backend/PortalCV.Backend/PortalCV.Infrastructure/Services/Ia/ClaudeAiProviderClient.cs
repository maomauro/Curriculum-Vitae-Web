using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PortalCV.Application.Interfaces;

namespace PortalCV.Infrastructure.Services;

/// <summary>Prueba de conexión real contra la API de mensajes de Claude (Anthropic).
/// Envía una solicitud mínima (1 token de respuesta) solo para validar que la clave y
/// el modelo funcionan — no se usa para generar contenido real todavía (eso es Fase 2+).</summary>
public class ClaudeAiProviderClient : IAiProviderClient
{
    private const string ModeloPorDefecto = "claude-3-5-haiku-20241022";

    private readonly HttpClient _http;

    public string Proveedor => "claude";

    public ClaudeAiProviderClient(HttpClient http)
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
            using var request = new HttpRequestMessage(HttpMethod.Post, "v1/messages");
            request.Headers.Add("x-api-key", apiKey);
            request.Headers.Add("anthropic-version", "2023-06-01");
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

        var contenido = new List<object>();
        if (imagenBytes is { Length: > 0 } && !string.IsNullOrWhiteSpace(imagenContentType))
        {
            contenido.Add(new
            {
                type = "image",
                source = new { type = "base64", media_type = imagenContentType, data = Convert.ToBase64String(imagenBytes) },
            });
        }
        contenido.Add(new { type = "text", text = prompt });

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "v1/messages");
            request.Headers.Add("x-api-key", apiKey);
            request.Headers.Add("anthropic-version", "2023-06-01");
            request.Content = JsonContent.Create(new
            {
                model = modeloFinal,
                // 4096 (no 2048): un CV completo en JSON (resumen + experiencia +
                // formación + proyectos + habilidades) puede superar 2048 tokens y
                // cortarse a mitad de camino, dejando un JSON inválido.
                max_tokens = 4096,
                messages = new[] { new { role = "user", content = contenido } },
            });

            using var response = await _http.SendAsync(request, ct);

            if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden)
                return (false, null, "La clave de API no es válida.");
            if (response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest)
                return (false, null, "El modelo indicado no existe o la solicitud no es válida. Verifica el nombre del modelo.");
            if (!response.IsSuccessStatusCode)
                return (false, null, $"El proveedor respondió con un error ({(int)response.StatusCode}).");

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
            var texto = doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString();
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
