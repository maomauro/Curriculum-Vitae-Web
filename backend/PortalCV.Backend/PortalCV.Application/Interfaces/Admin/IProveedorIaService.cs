using PortalCV.Application.DTOs.Admin;

namespace PortalCV.Application.Interfaces;

/// <summary>Conexión de IA global para toda la plataforma, administrada exclusivamente
/// por el rol Admin. Se pueden guardar varias (Claude, OpenAI, Gemini, Ollama/self-hosted,
/// otro) pero siempre hay exactamente una marcada como activa — la que usa todo el flujo
/// de IA (Analizar Oferta, Generar Perfil, Generar CV, etc.) para cualquier usuario. La
/// clave se guarda cifrada y nunca se devuelve al front-end, ni cifrada ni en texto plano.</summary>
public interface IProveedorIaService
{
    Task<IReadOnlyList<ProveedorIaDto>> ListarAsync(CancellationToken ct = default);

    /// <summary>La primera conexión que se guarda queda activa automáticamente.</summary>
    Task<ProveedorIaDto> CrearAsync(CrearProveedorIaRequest request, CancellationToken ct = default);

    Task<ProveedorIaDto> ActualizarAsync(
        int proveedorIaId, ActualizarProveedorIaRequest request, CancellationToken ct = default);

    /// <summary>Si se elimina la conexión activa y quedan otras, activa automáticamente
    /// la más reciente — nunca deja a la plataforma sin conexión activa mientras haya
    /// alguna guardada.</summary>
    Task EliminarAsync(int proveedorIaId, CancellationToken ct = default);

    /// <summary>Marca esta conexión como la activa y desactiva cualquier otra.</summary>
    Task<ProveedorIaDto> ActivarAsync(int proveedorIaId, CancellationToken ct = default);

    /// <summary>Prueba real de conexión, sin persistir nada. Si el proveedor pedido no
    /// tiene todavía un IAiProviderClient real (solo Claude por ahora), responde
    /// Ok=false con un mensaje claro en vez de fallar.</summary>
    Task<ProbarConexionIaResponse> ProbarConexionAsync(ProbarConexionIaRequest request, CancellationToken ct = default);

    /// <summary>Prueba una conexión ya guardada usando su clave cifrada (la descifra
    /// server-side) — el front-end nunca vuelve a tener la clave en texto plano, así que
    /// no puede reenviarla como en ProbarConexionAsync.</summary>
    Task<ProbarConexionIaResponse> ProbarConexionGuardadaAsync(int proveedorIaId, CancellationToken ct = default);
}
