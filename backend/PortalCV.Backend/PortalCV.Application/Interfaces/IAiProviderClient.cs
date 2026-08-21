namespace PortalCV.Application.Interfaces;

/// <summary>Cliente de un proveedor de IA externo — ver Fase 0.5 de
/// docs/arquitectura/Roadmap-Ofertas-IA.md. Implementaciones: Claude (Anthropic), Gemini
/// (Google) y Ollama (self-hosted); OpenAI y "otro" aún no tienen prueba real. Cada
/// implementación se registra en DI como IAiProviderClient (varias a la vez); el
/// consumidor las recibe como IEnumerable&lt;IAiProviderClient&gt; y elige por Proveedor.</summary>
public interface IAiProviderClient
{
    /// <summary>Código del proveedor que implementa este cliente (p. ej. "claude").</summary>
    string Proveedor { get; }

    /// <summary>Prueba real, sin persistir nada: valida que la clave/modelo/endpoint
    /// funcionen contra el proveedor. Nunca debe lanzar por errores del proveedor (401,
    /// 400, timeout, red) — esos casos se traducen a Ok=false con un mensaje claro.
    /// Endpoint solo aplica a proveedores self-hosted (p. ej. Ollama); apiKey es
    /// opcional porque no todos los proveedores lo requieren.</summary>
    Task<(bool Ok, string Mensaje)> ProbarConexionAsync(
        string? modelo, string? endpoint, string? apiKey, CancellationToken ct = default);
}
