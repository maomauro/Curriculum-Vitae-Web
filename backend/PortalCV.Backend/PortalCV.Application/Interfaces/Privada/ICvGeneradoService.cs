using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

/// <summary>Genera con IA un CV general (formato ATS) a partir de un Perfil del
/// candidato y su currículum completo -- sin oferta de por medio. Uno por Perfil;
/// regenerar reemplaza el contenido.</summary>
public interface ICvGeneradoService
{
    Task<IReadOnlyList<CvGeneradoDto>> ListarAsync(int curriculumId, CancellationToken ct = default);
    Task<CvGeneradoDto> GenerarAsync(int curriculumId, int perfilId, CancellationToken ct = default);
}
