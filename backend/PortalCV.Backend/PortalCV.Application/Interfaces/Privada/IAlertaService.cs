using PortalCV.Application.DTOs.Privada;

namespace PortalCV.Application.Interfaces;

public interface IAlertaService
{
    Task<AlertasPageDto> GetAlertasAsync(
        int curriculumId,
        bool soloNoLeidas = false,
        string? tipo = null,
        string? periodo = "mes",
        int page = 1,
        int pageSize = 10,
        CancellationToken ct = default);

    Task MarcarLeidaAsync(int curriculumId, int alertaId, CancellationToken ct = default);
    Task MarcarTodasLeidasAsync(int curriculumId, CancellationToken ct = default);
    Task<int> LimpiarLeidasAsync(int curriculumId, CancellationToken ct = default);
    Task<int> GetConteoNoLeidasAsync(int curriculumId, CancellationToken ct = default);
}

