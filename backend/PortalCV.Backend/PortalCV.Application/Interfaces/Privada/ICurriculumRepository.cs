using PortalCV.Domain.Entities;

namespace PortalCV.Application.Interfaces;

public interface ICurriculumRepository : IRepository<Curriculum>
{
    Task<Curriculum?> GetByUrlPublicaAsync(string urlPublica, CancellationToken ct = default);

    /// <summary>CV publicado con mismos includes que <see cref="GetByUrlPublicaAsync"/> (portal activo).</summary>
    Task<Curriculum?> GetPublicadoPorIdAsync(int curriculumId, CancellationToken ct = default);
    /// <summary>CV por id con includes de snapshot, sin filtrar por estado de publicación.</summary>
    Task<Curriculum?> GetByIdForSnapshotAsync(int curriculumId, CancellationToken ct = default);
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
