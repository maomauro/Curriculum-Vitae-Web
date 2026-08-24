using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

/// <summary>Selección de perfil con IA (Fase 3 del flujo de Ofertas -- ver
/// docs/arquitectura/Roadmap-Ofertas-IA.md, pasos 5-6). Dada una oferta (todavía no
/// necesita estar persistida) y los perfiles existentes del CV, sugiere reutilizar uno o
/// crear uno nuevo. No persiste nada -- el usuario confirma o cambia la sugerencia antes
/// de continuar.</summary>
public interface IPerfilSeleccionService
{
    Task<PerfilSugeridoDto> SugerirAsync(int curriculumId, SeleccionarPerfilRequest request, CancellationToken ct = default);
}
