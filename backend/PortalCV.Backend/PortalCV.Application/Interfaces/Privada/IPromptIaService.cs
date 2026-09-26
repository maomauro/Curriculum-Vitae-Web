using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

/// <summary>Administración de los prompts de IA propios del CV autenticado (self-service).</summary>
public interface IPromptIaService
{
    Task<IReadOnlyList<PromptIaListItemDto>> ListarAsync(int curriculumId, CancellationToken ct = default);

    Task<IReadOnlyList<PromptIaVersionDto>> ListarVersionesAsync(int curriculumId, string codigo, CancellationToken ct = default);

    /// <summary>Crea un Código nuevo para el CV (Version 1, activa de inmediato).</summary>
    Task<PromptIaVersionDto> CrearAsync(
        int curriculumId, CrearPromptIaRequest request, CancellationToken ct = default);

    /// <summary>Crea una nueva versión de un Código existente del CV (desactiva la anterior; no la sobrescribe).</summary>
    Task<PromptIaVersionDto> CrearVersionAsync(
        int curriculumId, string codigo, CrearVersionPromptIaRequest request, CancellationToken ct = default);

    /// <summary>Reactiva una versión anterior del CV (rollback): no crea una fila nueva.</summary>
    Task<PromptIaVersionDto> ActivarVersionAsync(
        int curriculumId, int promptIaId, CancellationToken ct = default);
}
