using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

/// <summary>Genera con IA un borrador de perfil profesional (NombrePerfil +
/// DescripcionPerfil) a partir de un enfoque corto escrito por el usuario y su
/// Experiencia/Formación/Proyectos/Habilidades reales. No persiste nada -- el usuario
/// revisa y edita el borrador en el formulario de "Nuevo perfil" antes de guardar.</summary>
public interface IPerfilGeneracionService
{
    Task<PerfilGeneradoIaDto> GenerarAsync(int curriculumId, GenerarPerfilConIaRequest request, CancellationToken ct = default);

    /// <summary>Sugiere ideas de enfoque de perfil a partir de todo el currículum, sin que
    /// el usuario tenga que escribir nada -- excluye los nombres que ya tiene como perfil.
    /// No persiste nada.</summary>
    Task<SugerirEnfoquesPerfilResponse> SugerirEnfoquesAsync(int curriculumId, CancellationToken ct = default);
}
