using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

/// <summary>Extracción real de datos de una oferta laboral con IA (Fase 2 del flujo de
/// Ofertas -- ver docs/arquitectura/Roadmap-Ofertas-IA.md). Usa el proveedor de IA activo
/// del CV (`ProveedorIa`) y el prompt activo `EXTRACTOR_OFERTA` (o el prompt por
/// defecto del sistema si el CV todavía no tiene uno propio). No persiste nada -- el
/// resultado se revisa/edita en el front y recién se guarda al confirmar, vía el CRUD
/// normal de <see cref="ICvEditorService"/>.</summary>
public interface IOfertaAnalisisService
{
    /// <summary>Al menos uno de <paramref name="texto"/> / <paramref name="imagenBytes"/>
    /// debe venir con contenido.</summary>
    Task<OfertaAnalizadaDto> AnalizarAsync(
        int curriculumId,
        string? texto,
        byte[]? imagenBytes,
        string? imagenContentType,
        string? nombreArchivoImagen,
        CancellationToken ct = default);
}
