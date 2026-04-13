using Microsoft.EntityFrameworkCore;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class PublicCvVisitaRegistroService : IPublicCvVisitaRegistroService
{
    private readonly PortalCvDbContext _context;

    public PublicCvVisitaRegistroService(PortalCvDbContext context)
    {
        _context = context;
    }

    public async Task RegistrarVistaAsync(int curriculumId, string? visitanteAnonimoId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(visitanteAnonimoId))
            return;

        var vid = visitanteAnonimoId.Trim();
        if (vid.Length > 36 || !Guid.TryParse(vid, out _))
            return;

        var existing = await _context.AlertasVisita
            .FirstOrDefaultAsync(a =>
                a.CurriculumId == curriculumId &&
                a.TipoVisita == "Vista" &&
                a.VisitanteAnonimoId == vid, ct);

        if (existing is null)
        {
            await _context.AlertasVisita.AddAsync(new AlertaVisita
            {
                CurriculumId = curriculumId,
                FechaVisita = DateTime.UtcNow,
                TipoVisita = "Vista",
                VisitanteAnonimoId = vid,
                VistasAcumuladas = 1,
                EsLeida = false,
                Titulo = "Nueva visita a tu CV",
                Descripcion = "Visto 1 vez"
            }, ct);
        }
        else
        {
            existing.FechaVisita = DateTime.UtcNow;
            existing.VistasAcumuladas++;
            existing.Descripcion = existing.VistasAcumuladas == 1
                ? "Visto 1 vez"
                : $"Visto {existing.VistasAcumuladas} veces";
            existing.Titulo = "Nueva visita a tu CV";
            existing.EsLeida = false;
        }

        await _context.SaveChangesAsync(ct);
    }
}
