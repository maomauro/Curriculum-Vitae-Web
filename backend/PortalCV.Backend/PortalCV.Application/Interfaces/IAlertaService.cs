using PortalCV.Application.DTOs.Alertas;

namespace PortalCV.Application.Interfaces;

public interface IAlertaService
{
    Task<IReadOnlyList<AlertaVisitaDto>> GetAlertasAsync(int curriculumId, bool soloNoLeidas = false, CancellationToken ct = default);
    Task MarcarLeidaAsync(int curriculumId, int alertaId, CancellationToken ct = default);
    Task MarcarTodasLeidasAsync(int curriculumId, CancellationToken ct = default);
    Task<int> GetConteoNoLeidasAsync(int curriculumId, CancellationToken ct = default);
}
