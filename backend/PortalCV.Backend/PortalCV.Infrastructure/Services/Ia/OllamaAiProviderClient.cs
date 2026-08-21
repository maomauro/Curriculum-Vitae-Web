using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using PortalCV.Application.Interfaces;

namespace PortalCV.Infrastructure.Services;

/// <summary>Prueba de conexión real contra un servidor Ollama self-hosted (Docker local,
/// red LAN, etc.). A diferencia de los demás proveedores, el host no es fijo: cada
/// conexión guardada trae su propio Endpoint. Ollama normalmente no exige clave de API
/// (apiKey es opcional; si se define, se envía como Bearer por si el usuario puso un
/// proxy con autenticación delante). Usa GET /api/tags -- lista los modelos descargados
/// -- para validar que el servidor responde y, si se indicó un modelo, que está
/// disponible localmente.</summary>
public class OllamaAiProviderClient : IAiProviderClient
{
    // Bloqueo mínimo de direcciones de metadatos de nube (defensa en profundidad contra
    // SSRF): el resto de direcciones privadas/locales se permiten deliberadamente, porque
    // apuntar a localhost/LAN/Docker es el uso normal de este proveedor.
    private static readonly string[] HostsBloqueados = { "169.254.169.254", "metadata.google.internal" };

    private readonly HttpClient _http;

    public string Proveedor => "ollama";

    public OllamaAiProviderClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<(bool Ok, string Mensaje)> ProbarConexionAsync(
        string? modelo, string? endpoint, string? apiKey, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(endpoint))
            return (false, "La URL del servidor Ollama es requerida.");

        if (!Uri.TryCreate(endpoint.Trim(), UriKind.Absolute, out var baseUri) ||
            (baseUri.Scheme != Uri.UriSchemeHttp && baseUri.Scheme != Uri.UriSchemeHttps))
            return (false, "La URL del servidor Ollama no es válida.");

        if (HostsBloqueados.Contains(baseUri.Host, StringComparer.OrdinalIgnoreCase))
            return (false, "Esa dirección no está permitida como endpoint.");

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, new Uri(baseUri, "/api/tags"));
            if (!string.IsNullOrWhiteSpace(apiKey))
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            using var response = await _http.SendAsync(request, ct);

            if (!response.IsSuccessStatusCode)
                return (false, $"El servidor Ollama respondió con un error ({(int)response.StatusCode}).");

            if (string.IsNullOrWhiteSpace(modelo))
                return (true, "Conexión exitosa.");

            var cuerpo = await response.Content.ReadFromJsonAsync<OllamaTagsResponse>(cancellationToken: ct);
            var modeloBuscado = modelo.Trim();
            var modeloExiste = cuerpo?.Models?.Any(m =>
                string.Equals(m.Name, modeloBuscado, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(m.Name?.Split(':')[0], modeloBuscado, StringComparison.OrdinalIgnoreCase)) ?? false;

            return modeloExiste
                ? (true, "Conexión exitosa.")
                : (true, $"Conexión exitosa, pero el modelo \"{modeloBuscado}\" no está descargado en este servidor (usa: ollama pull {modeloBuscado}).");
        }
        catch (TaskCanceledException)
        {
            return (false, "Tiempo de espera agotado al conectar con el servidor Ollama.");
        }
        catch (HttpRequestException)
        {
            return (false, "No se pudo conectar con el servidor Ollama. Verifica que esté corriendo y accesible.");
        }
        catch (JsonException)
        {
            return (false, "El servidor respondió, pero no con el formato esperado de Ollama.");
        }
    }

    private sealed class OllamaTagsResponse
    {
        public List<OllamaModelo>? Models { get; set; }
    }

    private sealed class OllamaModelo
    {
        public string? Name { get; set; }
    }
}
