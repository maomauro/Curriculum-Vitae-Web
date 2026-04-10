using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

public interface ICvEditorService
{
    // Personales (1:1 con Curriculum)
    Task<PersonalesDto?> GetPersonalesAsync(int curriculumId, CancellationToken ct = default);
    Task<PersonalesDto> UpsertPersonalesAsync(int curriculumId, UpsertPersonalesRequest request, CancellationToken ct = default);

    // Perfil
    Task<IReadOnlyList<PerfilDto>> GetPerfilesAsync(int curriculumId, CancellationToken ct = default);
    Task<PerfilDto> CreatePerfilAsync(int curriculumId, UpsertPerfilRequest request, CancellationToken ct = default);
    Task<PerfilDto> UpdatePerfilAsync(int curriculumId, int perfilId, UpsertPerfilRequest request, CancellationToken ct = default);
    Task DeletePerfilAsync(int curriculumId, int perfilId, CancellationToken ct = default);

    // Experiencia
    Task<IReadOnlyList<ExperienciaDto>> GetExperienciasAsync(int curriculumId, CancellationToken ct = default);
    Task<ExperienciaDto> CreateExperienciaAsync(int curriculumId, UpsertExperienciaRequest request, CancellationToken ct = default);
    Task<ExperienciaDto> UpdateExperienciaAsync(int curriculumId, int experienciaId, UpsertExperienciaRequest request, CancellationToken ct = default);
    Task DeleteExperienciaAsync(int curriculumId, int experienciaId, CancellationToken ct = default);

    // FormaciÃ³n
    Task<IReadOnlyList<FormacionDto>> GetFormacionesAsync(int curriculumId, CancellationToken ct = default);
    Task<FormacionDto> CreateFormacionAsync(int curriculumId, UpsertFormacionRequest request, CancellationToken ct = default);
    Task<FormacionDto> UpdateFormacionAsync(int curriculumId, int formacionId, UpsertFormacionRequest request, CancellationToken ct = default);
    Task DeleteFormacionAsync(int curriculumId, int formacionId, CancellationToken ct = default);

    // Habilidades
    Task<IReadOnlyList<HabilidadDto>> GetHabilidadesAsync(int curriculumId, CancellationToken ct = default);
    Task<HabilidadDto> CreateHabilidadAsync(int curriculumId, UpsertHabilidadRequest request, CancellationToken ct = default);
    Task<HabilidadDto> UpdateHabilidadAsync(int curriculumId, int habilidadId, UpsertHabilidadRequest request, CancellationToken ct = default);
    Task DeleteHabilidadAsync(int curriculumId, int habilidadId, CancellationToken ct = default);

    // Proyectos
    Task<IReadOnlyList<ProyectoDto>> GetProyectosAsync(int curriculumId, CancellationToken ct = default);
    Task<ProyectoDto> CreateProyectoAsync(int curriculumId, UpsertProyectoRequest request, CancellationToken ct = default);
    Task<ProyectoDto> UpdateProyectoAsync(int curriculumId, int proyectoId, UpsertProyectoRequest request, CancellationToken ct = default);
    Task DeleteProyectoAsync(int curriculumId, int proyectoId, CancellationToken ct = default);

    // Referencias
    Task<IReadOnlyList<ReferenciaDto>> GetReferenciasAsync(int curriculumId, CancellationToken ct = default);
    Task<ReferenciaDto> CreateReferenciaAsync(int curriculumId, UpsertReferenciaRequest request, CancellationToken ct = default);
    Task<ReferenciaDto> UpdateReferenciaAsync(int curriculumId, int referenciaId, UpsertReferenciaRequest request, CancellationToken ct = default);
    Task DeleteReferenciaAsync(int curriculumId, int referenciaId, CancellationToken ct = default);

    // Redes sociales
    Task<IReadOnlyList<RedSocialDto>> GetRedesSocialesAsync(int curriculumId, CancellationToken ct = default);
    Task<RedSocialDto> CreateRedSocialAsync(int curriculumId, UpsertRedSocialRequest request, CancellationToken ct = default);
    Task<RedSocialDto> UpdateRedSocialAsync(int curriculumId, int redSocialId, UpsertRedSocialRequest request, CancellationToken ct = default);
    Task DeleteRedSocialAsync(int curriculumId, int redSocialId, CancellationToken ct = default);

    // Familiares / contactos de emergencia
    Task<IReadOnlyList<FamiliarContactoDto>> GetFamiliaresAsync(int curriculumId, CancellationToken ct = default);
    Task<FamiliarContactoDto> CreateFamiliarAsync(int curriculumId, UpsertFamiliarContactoRequest request, CancellationToken ct = default);
    Task<FamiliarContactoDto> UpdateFamiliarAsync(int curriculumId, int familiarId, UpsertFamiliarContactoRequest request, CancellationToken ct = default);
    Task DeleteFamiliarAsync(int curriculumId, int familiarId, CancellationToken ct = default);

    // Visibilidad de secciones
    Task<IReadOnlyList<VisibilidadSeccionDto>> GetVisibilidadAsync(int curriculumId, CancellationToken ct = default);
    Task<IReadOnlyList<VisibilidadSeccionDto>> UpdateVisibilidadAsync(int curriculumId, IEnumerable<UpdateVisibilidadRequest> cambios, CancellationToken ct = default);

    // Plantilla de presentación (Mi CV / impresión)
    Task<PresentacionCvDto> GetPresentacionAsync(int curriculumId, CancellationToken ct = default);
    Task<PresentacionCvDto> UpdatePresentacionAsync(int curriculumId, UpdatePresentacionCvRequest request, CancellationToken ct = default);
    Task<PresentacionCvDto> UpdateCurriculumPublicacionAsync(int curriculumId, bool publicado, CancellationToken ct = default);
}

