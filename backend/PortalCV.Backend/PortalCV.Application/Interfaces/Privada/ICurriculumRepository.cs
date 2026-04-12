using PortalCV.Domain.Entities;

namespace PortalCV.Application.Interfaces;

public interface ICurriculumRepository : IRepository<Curriculum>
{
    Task<Curriculum?> GetByUrlPublicaAsync(string urlPublica, CancellationToken ct = default);
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
