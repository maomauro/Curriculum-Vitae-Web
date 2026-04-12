namespace PortalCV.Application.Interfaces;

/// <summary>
/// Persiste visita pública (alerta, contador, estadísticas). Pensado para ejecutarse fuera del camino crítico de <see cref="IPublicCvService.GetDetalleAsync"/>.
/// </summary>
public interface IPublicCvVisitaRegistroService
{
    Task RegistrarVistaAsync(int curriculumId, CancellationToken ct = default);
}
