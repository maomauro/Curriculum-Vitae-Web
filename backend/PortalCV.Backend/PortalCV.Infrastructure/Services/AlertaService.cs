using Microsoft.EntityFrameworkCore;
using PortalCV.Application.DTOs.Alertas;
using PortalCV.Application.Interfaces;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class AlertaService : IAlertaService
{
    private readonly PortalCvDbContext _context;

    public AlertaService(PortalCvDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<AlertaVisitaDto>> GetAlertasAsync(
        int curriculumId, bool soloNoLeidas = false, CancellationToken ct = default)
    {
        var query = _context.AlertasVisita
            .AsNoTracking()
            .Where(a => a.CurriculumId == curriculumId);

        if (soloNoLeidas)
            query = query.Where(a => !a.EsLeida);

        return await query
            .OrderByDescending(a => a.FechaVisita)
            .Select(a => new AlertaVisitaDto(
                a.AlertaVisitaId, a.CurriculumId, a.FechaVisita, a.Origen,
                a.TipoVisita, a.EsLeida, a.Titulo, a.Descripcion, a.Ciudad, a.Pais))
            .ToListAsync(ct);
    }

    public async Task MarcarLeidaAsync(int curriculumId, int alertaId, CancellationToken ct = default)
    {
        var alerta = await _context.AlertasVisita
            .FirstOrDefaultAsync(a => a.AlertaVisitaId == alertaId && a.CurriculumId == curriculumId, ct)
            ?? throw new KeyNotFoundException($"Alerta {alertaId} no encontrada.");

        alerta.EsLeida = true;
        await _context.SaveChangesAsync(ct);
    }

    public async Task MarcarTodasLeidasAsync(int curriculumId, CancellationToken ct = default)
    {
        var alertas = await _context.AlertasVisita
            .Where(a => a.CurriculumId == curriculumId && !a.EsLeida)
            .ToListAsync(ct);

        foreach (var a in alertas)
            a.EsLeida = true;

        await _context.SaveChangesAsync(ct);
    }

    public async Task<int> GetConteoNoLeidasAsync(int curriculumId, CancellationToken ct = default)
        => await _context.AlertasVisita
            .CountAsync(a => a.CurriculumId == curriculumId && !a.EsLeida, ct);
}
