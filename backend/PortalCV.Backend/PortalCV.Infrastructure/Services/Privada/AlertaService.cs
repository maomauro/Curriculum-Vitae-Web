using Microsoft.EntityFrameworkCore;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class AlertaService : IAlertaService
{
    private readonly PortalCvDbContext _context;

    public AlertaService(PortalCvDbContext context)
    {
        _context = context;
    }

    public async Task<AlertasPageDto> GetAlertasAsync(
        int curriculumId,
        bool soloNoLeidas = false,
        string? tipo = null,
        string? periodo = "mes",
        int page = 1,
        int pageSize = 10,
        CancellationToken ct = default)
    {
        var query = _context.AlertasVisita
            .AsNoTracking()
            .Where(a => a.CurriculumId == curriculumId);

        if (soloNoLeidas)
            query = query.Where(a => !a.EsLeida);

        if (!string.IsNullOrWhiteSpace(tipo))
            query = query.Where(a => a.TipoVisita == tipo);

        var desde = ResolveFechaDesde(periodo);
        if (desde.HasValue)
            query = query.Where(a => a.FechaVisita >= desde.Value);

        if (page < 1) page = 1;
        if (pageSize is < 1 or > 100) pageSize = 10;

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(a => a.FechaVisita)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AlertaVisitaDto(
                a.AlertaVisitaId, a.CurriculumId, a.FechaVisita, a.Origen,
                a.TipoVisita, a.EsLeida, a.Titulo, a.Descripcion, a.Ciudad, a.Pais,
                (a.TipoVisita == "Vista" || a.TipoVisita == "Descarga") ? a.VistasAcumuladas : (int?)null))
            .ToListAsync(ct);

        var totalPages = total == 0 ? 1 : (int)Math.Ceiling((double)total / pageSize);
        return new AlertasPageDto(items, total, page, pageSize, totalPages);
    }

    public async Task MarcarLeidaAsync(int curriculumId, int alertaId, CancellationToken ct = default)
    {
        var alerta = await _context.AlertasVisita
            .FirstOrDefaultAsync(a => a.AlertaVisitaId == alertaId && a.CurriculumId == curriculumId, ct)
            ?? throw new KeyNotFoundException($"Alerta {alertaId} no encontrada.");

        alerta.EsLeida = true;
        if (alerta.TipoVisita == "Contacto" && alerta.VisitanteContactoId is { } cid)
        {
            var vc = await _context.VisitantesContacto
                .FirstOrDefaultAsync(v => v.VisitanteContactoId == cid && v.CurriculumId == curriculumId, ct);
            if (vc is not null)
                vc.EsLeido = true;
        }

        await _context.SaveChangesAsync(ct);
    }

    public async Task MarcarTodasLeidasAsync(int curriculumId, CancellationToken ct = default)
    {
        var alertas = await _context.AlertasVisita
            .Where(a => a.CurriculumId == curriculumId && !a.EsLeida)
            .ToListAsync(ct);

        foreach (var a in alertas)
            a.EsLeida = true;

        await MarcarContactosLeidosPorAlertasAsync(curriculumId, alertas, ct);

        await _context.SaveChangesAsync(ct);
    }

    public async Task<int> LimpiarLeidasAsync(int curriculumId, CancellationToken ct = default)
    {
        var leidas = await _context.AlertasVisita
            .Where(a => a.CurriculumId == curriculumId && a.EsLeida)
            .ToListAsync(ct);

        if (leidas.Count == 0) return 0;

        await MarcarContactosLeidosPorAlertasAsync(curriculumId, leidas, ct);

        _context.AlertasVisita.RemoveRange(leidas);
        await _context.SaveChangesAsync(ct);
        return leidas.Count;
    }

    public async Task<int> GetConteoNoLeidasAsync(int curriculumId, CancellationToken ct = default)
        => await _context.AlertasVisita
            .CountAsync(a => a.CurriculumId == curriculumId && !a.EsLeida, ct);

    private static DateTime? ResolveFechaDesde(string? periodo)
    {
        var now = DateTime.UtcNow;
        return (periodo ?? "mes").Trim().ToLowerInvariant() switch
        {
            "semana" => now.AddDays(-7),
            "mes" => now.AddDays(-30),
            "tresmeses" => now.AddDays(-90),
            "todo" => null,
            _ => now.AddDays(-30)
        };
    }

    private async Task MarcarContactosLeidosPorAlertasAsync(
        int curriculumId,
        IReadOnlyList<AlertaVisita> alertas,
        CancellationToken ct)
    {
        var ids = alertas
            .Where(a => a.TipoVisita == "Contacto" && a.VisitanteContactoId.HasValue)
            .Select(a => a.VisitanteContactoId!.Value)
            .Distinct()
            .ToList();
        if (ids.Count == 0) return;

        var contactos = await _context.VisitantesContacto
            .Where(v => ids.Contains(v.VisitanteContactoId) && v.CurriculumId == curriculumId)
            .ToListAsync(ct);
        foreach (var v in contactos)
            v.EsLeido = true;
    }
}

