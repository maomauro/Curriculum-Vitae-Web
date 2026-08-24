using PortalCV.Domain.Entities;

namespace PortalCV.Application.Interfaces;

public interface ICurriculumRepository : IRepository<Curriculum>
{
    Task<Curriculum?> GetByUrlPublicaAsync(string urlPublica, CancellationToken ct = default);

    /// <summary>Mismo resultado que <see cref="GetByUrlPublicaAsync"/>, pero Experiencias/
    /// Formaciones se cargan sin el LOB AdjuntoSoporteBytes completo (solo un marcador de
    /// "hay adjunto o no"). Usar para el consolidado de "Información profesional" (pública
    /// y preview de Configuración), que solo necesita armar el link de descarga, no los
    /// bytes en sí -- para descargar el adjunto real seguir usando
    /// <see cref="GetByUrlPublicaAsync"/>.</summary>
    Task<Curriculum?> GetByUrlPublicaSinAdjuntosAsync(string urlPublica, CancellationToken ct = default);

    /// <summary>CV publicado con mismos includes que <see cref="GetByUrlPublicaAsync"/> (portal activo).</summary>
    Task<Curriculum?> GetPublicadoPorIdAsync(int curriculumId, CancellationToken ct = default);

    /// <summary>Mismos includes que <see cref="GetPublicadoPorIdAsync"/>, pero sin exigir
    /// Estado=Publicado -- para que el dueño del CV pueda previsualizar cómo se vería su
    /// perfil público antes de publicarlo.</summary>
    Task<Curriculum?> GetParaPreviewPublicoPorIdAsync(int curriculumId, CancellationToken ct = default);

    /// <summary>Mismo resultado que <see cref="GetParaPreviewPublicoPorIdAsync"/>, pero sin el
    /// LOB AdjuntoSoporteBytes completo en Experiencias/Formaciones -- ver
    /// <see cref="GetByUrlPublicaSinAdjuntosAsync"/>.</summary>
    Task<Curriculum?> GetParaPreviewPublicoPorIdSinAdjuntosAsync(int curriculumId, CancellationToken ct = default);
    Task<Curriculum?> GetByUsuarioIdAsync(int usuarioId, CancellationToken ct = default);
    Task<bool> UrlPublicaExisteAsync(string urlPublica, int? excludeCurriculumId = null, CancellationToken ct = default);
    Task<(IReadOnlyList<Curriculum> Items, int Total)> BuscarPublicosAsync(
        string? ciudad,
        string? habilidad,
        string? palabraClave,
        int page,
        int pageSize,
        CancellationToken ct = default);

    /// <summary>Indica si el CV del usuario está publicado (<c>Curriculum.Estado</c> publicado). Usuarios sin fila no aparecen en el diccionario.</summary>
    Task<IReadOnlyDictionary<int, bool>> GetCvPublicadoPorUsuarioIdsAsync(
        IReadOnlyCollection<int> usuarioIds,
        CancellationToken ct = default);
}
