using PortalCV.Application.DTOs.Public;

namespace PortalCV.Application.Interfaces;

public interface IPublicCvService
{
    Task<(IReadOnlyList<CvListadoItemDto> Items, int Total)> BuscarCvsAsync(BuscarCvsQuery query, CancellationToken ct = default);
    Task<CvDetalleDto?> GetDetalleAsync(string urlPublica, CancellationToken ct = default);
    Task ContactarAsync(int curriculumId, ContactarCvRequest request, CancellationToken ct = default);
}
