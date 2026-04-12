using Microsoft.EntityFrameworkCore;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

internal static class EstadisticasPublicasUpdater
{
    public static async Task ActualizarAsync(
        PortalCvDbContext context,
        int curriculumId,
        bool esContacto,
        CancellationToken ct = default)
    {
        var stats = await context.EstadisticasPublicas
            .FirstOrDefaultAsync(e => e.CurriculumId == curriculumId, ct);

        if (stats is null)
        {
            stats = new EstadisticasPublicas
            {
                CurriculumId = curriculumId,
                TotalVisitas = esContacto ? 0 : 1,
                TotalContactos = esContacto ? 1 : 0,
                UltimaVisita = esContacto ? null : DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            };
            await context.EstadisticasPublicas.AddAsync(stats, ct);
        }
        else
        {
            if (esContacto) stats.TotalContactos++;
            else
            {
                stats.TotalVisitas++;
                stats.UltimaVisita = DateTime.UtcNow;
            }
            stats.FechaActualizacion = DateTime.UtcNow;
        }
    }
}
