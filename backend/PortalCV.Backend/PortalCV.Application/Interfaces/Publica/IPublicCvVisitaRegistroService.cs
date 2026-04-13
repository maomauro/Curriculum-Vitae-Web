namespace PortalCV.Application.Interfaces;

/// <summary>
/// Persiste visita pública (alerta, contador, estadísticas). Pensado para ejecutarse fuera del camino crítico de <see cref="IPublicCvService.GetDetalleAsync"/>.
/// </summary>
public interface IPublicCvVisitaRegistroService
{
    /// <param name="visitanteAnonimoId">UUID del navegador (query <c>vid</c>). Si falta o no es válido, no se registra vista.</param>
    Task RegistrarVistaAsync(int curriculumId, string? visitanteAnonimoId, CancellationToken ct = default);
}
