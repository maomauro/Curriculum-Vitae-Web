using PortalCV.Application.DTOs.Publica;

namespace PortalCV.Application.Interfaces;

public interface IPublicCvService
{
    Task<(IReadOnlyList<CvListadoItemDto> Items, int Total)> BuscarCvsAsync(BuscarCvsQuery query, CancellationToken ct = default);
    Task<CvDetalleDto?> GetDetalleAsync(string urlPublica, string? visitanteAnonimoId = null, CancellationToken ct = default);
    Task<CvEstadisticasDto?> GetEstadisticasAsync(string urlPublica, CancellationToken ct = default);
    Task<FiltrosPublicosDto> GetFiltrosAsync(CancellationToken ct = default);
    Task ContactarAsync(string urlPublica, ContactarCvRequest request, CancellationToken ct = default);
    /// <summary>Registra uso de Imprimir / PDF (alerta Descarga deduplicada por visitante anónimo).</summary>
    Task RegistrarImpresionPdfAsync(string urlPublica, string? visitanteAnonimoId = null, CancellationToken ct = default);
}

