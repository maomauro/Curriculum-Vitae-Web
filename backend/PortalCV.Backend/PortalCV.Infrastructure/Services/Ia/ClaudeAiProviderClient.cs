using System.Net;
using System.Net.Http.Json;
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
}
