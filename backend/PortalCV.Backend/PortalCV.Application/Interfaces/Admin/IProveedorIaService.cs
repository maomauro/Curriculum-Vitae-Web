using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

/// <summary>Conexiones con proveedores de IA propias de cada CV (self-service). Un CV
/// puede guardar varias conexiones (Claude, OpenAI, Gemini, Ollama/self-hosted, otro) y
/// tener siempre exactamente una marcada como activa — la que usa el flujo de Ofertas —
/// ver Fase 0.5 de docs/arquitectura/Roadmap-Ofertas-IA.md. La clave se guarda cifrada y
/// nunca se devuelve al front-end, ni cifrada ni en texto plano.</summary>
public interface IProveedorIaService
{
    Task<IReadOnlyList<ProveedorIaDto>> ListarAsync(int curriculumId, CancellationToken ct = default);

    /// <summary>La primera conexión que se guarda para un CV queda activa automáticamente.</summary>
    Task<ProveedorIaDto> CrearAsync(
        int curriculumId, CrearProveedorIaRequest request, CancellationToken ct = default);

    Task<ProveedorIaDto> ActualizarAsync(
        int curriculumId, int proveedorIaId, ActualizarProveedorIaRequest request, CancellationToken ct = default);

    /// <summary>Si se elimina la conexión activa y quedan otras, activa automáticamente
    /// la más reciente — nunca deja al CV sin conexión activa mientras tenga alguna guardada.</summary>
    Task EliminarAsync(int curriculumId, int proveedorIaId, CancellationToken ct = default);

    /// <summary>Marca esta conexión como la activa y desactiva cualquier otra del mismo CV.</summary>
    Task<ProveedorIaDto> ActivarAsync(int curriculumId, int proveedorIaId, CancellationToken ct = default);

    /// <summary>Prueba real de conexión, sin persistir nada. Si el proveedor pedido no
    /// tiene todavía un IAiProviderClient real (solo Claude por ahora), responde
    /// Ok=false con un mensaje claro en vez de fallar.</summary>
    Task<ProbarConexionIaResponse> ProbarConexionAsync(ProbarConexionIaRequest request, CancellationToken ct = default);

    /// <summary>Prueba una conexión ya guardada usando su clave cifrada (la descifra
    /// server-side) — el front-end nunca vuelve a tener la clave en texto plano, así que
    /// no puede reenviarla como en ProbarConexionAsync.</summary>
    Task<ProbarConexionIaResponse> ProbarConexionGuardadaAsync(int curriculumId, int proveedorIaId, CancellationToken ct = default);
}
