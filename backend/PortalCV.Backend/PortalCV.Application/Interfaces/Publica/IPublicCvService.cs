using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.DTOs.Publica;

namespace PortalCV.Application.Interfaces;

public interface IPublicCvService
{
    Task<(IReadOnlyList<CvListadoItemDto> Items, int Total)> BuscarCvsAsync(BuscarCvsQuery query, CancellationToken ct = default);
    Task<CvDetalleDto?> GetDetalleAsync(string urlPublica, string? visitanteAnonimoId = null, CancellationToken ct = default);

    /// <summary>Sirve la foto de perfil en crudo para un CV público, respetando el mismo
    /// interruptor de visibilidad (<c>datos-personales.foto</c>) que <see cref="GetDetalleAsync"/>.</summary>
    Task<ArchivoContenidoDto?> GetFotoPersonalesPublicaAsync(string urlPublica, CancellationToken ct = default);

    /// <summary>Sirve el soporte de una experiencia laboral, respetando el mismo interruptor
    /// (<c>experiencia.soporte-certificacion-laboral</c>) que <see cref="GetDetalleAsync"/>.</summary>
    Task<ArchivoContenidoDto?> GetAdjuntoExperienciaPublicaAsync(string urlPublica, int experienciaId, CancellationToken ct = default);

    /// <summary>Sirve el soporte de una formación, respetando el mismo criterio de bloque
    /// (formación académica / diplomados / certificaciones / cursos) que <see cref="GetDetalleAsync"/>.</summary>
    Task<ArchivoContenidoDto?> GetAdjuntoFormacionPublicaAsync(string urlPublica, int formacionId, CancellationToken ct = default);

    /// <summary>Mismo DTO y mismo filtrado por VisibilidadSeccion que ve un visitante,
    /// pero para el dueño del CV -- sin exigir que esté publicado y sin registrar visita.
    /// Usado por el panel de vista previa en Configuración.</summary>
    Task<CvDetalleDto?> GetPreviewPrivadoAsync(int curriculumId, CancellationToken ct = default);
    Task<CvEstadisticasDto?> GetEstadisticasAsync(string urlPublica, CancellationToken ct = default);
    Task<FiltrosPublicosDto> GetFiltrosAsync(CancellationToken ct = default);
    Task ContactarAsync(string urlPublica, ContactarCvRequest request, CancellationToken ct = default);

    /// <summary>Registra uso de Imprimir / PDF (alerta Descarga deduplicada por visitante anónimo).</summary>
    Task RegistrarImpresionPdfAsync(string urlPublica, string? visitanteAnonimoId = null, CancellationToken ct = default);
}

