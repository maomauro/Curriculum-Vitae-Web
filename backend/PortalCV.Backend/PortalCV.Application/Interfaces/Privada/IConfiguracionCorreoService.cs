using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

/// <summary>Configuración SMTP para el envío de correos a reclutadores (ver flujo de
/// Analizar Oferta → Enviar correo). Una por CV -- Get devuelve valores por defecto
/// (Gmail) si el CV todavía no configuró nada.</summary>
public interface IConfiguracionCorreoService
{
    Task<ConfiguracionCorreoDto> ObtenerAsync(int curriculumId, CancellationToken ct = default);

    /// <summary>Crea o actualiza la configuración (upsert, es 1 por CV). Password
    /// null/vacío en una actualización mantiene la contraseña ya guardada.</summary>
    Task<ConfiguracionCorreoDto> GuardarAsync(
        int curriculumId, GuardarConfiguracionCorreoRequest request, CancellationToken ct = default);
}
