using PortalCV.Domain.Entities;

namespace PortalCV.Application.Interfaces;

/// <summary>
/// Acceso a datos de <see cref="PromptIa"/>, siempre acotado al CV dueño. La lectura de la
/// versión activa por Código se sirve desde una caché en memoria para no consultar la base de
/// datos en cada llamada a la IA; las operaciones de escritura invalidan esa caché para el
/// (Curriculum, Código) afectado.
/// </summary>
public interface IPromptIaRepository
{
    /// <summary>Versión activa (EsActivo=1) de un prompt del CV por Código. Usa caché en memoria.</summary>
    Task<PromptIa?> GetActivoPorCodigoAsync(int curriculumId, string codigo, CancellationToken ct = default);

    /// <summary>La versión activa de cada Código del CV, para su tabla de administración.</summary>
    Task<IReadOnlyList<PromptIa>> ListarActivosAsync(int curriculumId, CancellationToken ct = default);

    /// <summary>Historial completo de versiones de un Código del CV, más reciente primero.</summary>
    Task<IReadOnlyList<PromptIa>> ListarVersionesPorCodigoAsync(int curriculumId, string codigo, CancellationToken ct = default);

    Task<bool> ExisteCodigoAsync(int curriculumId, string codigo, CancellationToken ct = default);

    /// <summary>Inserta una fila nueva (Version 1 si es Código nuevo del CV, o Version+1 si ya existía
    /// una activa — en ese caso desactiva la anterior). Invalida la caché.</summary>
    Task<PromptIa> GuardarNuevaVersionAsync(PromptIa version, CancellationToken ct = default);

    /// <summary>Reactiva una versión anterior del CV (rollback) y desactiva la que estaba activa. Invalida la caché.</summary>
    Task<PromptIa> ActivarVersionAsync(int curriculumId, int promptIaId, CancellationToken ct = default);
}
