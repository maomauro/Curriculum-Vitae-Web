using Microsoft.EntityFrameworkCore;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly PortalCvDbContext _context;

    public DashboardService(PortalCvDbContext context)
    {
        _context = context;
    }

    // â”€â”€ HS-52: EstadÃ­sticas del dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public async Task<DashboardStatsDto> GetStatsAsync(int curriculumId, CancellationToken ct = default)
    {
        var stats = await _context.EstadisticasPublicas
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.CurriculumId == curriculumId, ct);

        var alertasNoLeidas = await _context.AlertasVisita
            .CountAsync(a => a.CurriculumId == curriculumId && !a.EsLeida, ct);

        var completitud = await CalcularCompletitudAsync(curriculumId, ct);

        return new DashboardStatsDto(
            TotalVisitas: stats?.TotalVisitas ?? 0,
            TotalContactos: stats?.TotalContactos ?? 0,
            AlertasNoLeidas: alertasNoLeidas,
            PorcentajeCompletitud: completitud,
            UltimaVisita: stats?.UltimaVisita,
            FechaActualizacion: stats?.FechaActualizacion ?? DateTime.UtcNow);
    }

    // â”€â”€ HS-53: Lista de contactos recibidos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public async Task<IReadOnlyList<ContactoDto>> GetContactosAsync(int curriculumId, CancellationToken ct = default)
    {
        return await _context.VisitantesContacto
            .AsNoTracking()
            .Where(v => v.CurriculumId == curriculumId)
            .OrderByDescending(v => v.FechaContacto)
            .Select(v => new ContactoDto(
                v.VisitanteContactoId,
                v.Nombre,
                v.Correo,
                v.Empresa,
                v.MotivoContacto,
                v.Asunto,
                v.Mensaje,
                v.FechaContacto,
                v.EsLeido))
            .ToListAsync(ct);
    }

    // â”€â”€ HS-54: Marcar contacto como leÃ­do â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public async Task MarcarContactoLeidoAsync(int curriculumId, int contactoId, CancellationToken ct = default)
    {
        var contacto = await _context.VisitantesContacto
            .FirstOrDefaultAsync(v => v.VisitanteContactoId == contactoId && v.CurriculumId == curriculumId, ct)
            ?? throw new KeyNotFoundException($"Contacto {contactoId} no encontrado.");

        contacto.EsLeido = true;
        await _context.SaveChangesAsync(ct);
    }

    // â”€â”€ HS-55: Notificaciones (campanita) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public async Task<NotificacionesResumenDto> GetNotificacionesAsync(
        int curriculumId, int limite = 10, CancellationToken ct = default)
    {
        var conteoNoLeidas = await _context.AlertasVisita
            .CountAsync(a => a.CurriculumId == curriculumId && !a.EsLeida, ct);

        var recientes = await _context.AlertasVisita
            .AsNoTracking()
            .Where(a => a.CurriculumId == curriculumId)
            .OrderByDescending(a => a.FechaVisita)
            .Take(limite)
            .Select(a => new NotificacionItemDto(
                a.AlertaVisitaId,
                a.TipoVisita,
                a.Titulo,
                a.Descripcion,
                a.EsLeida,
                a.FechaVisita))
            .ToListAsync(ct);

        return new NotificacionesResumenDto(conteoNoLeidas, recientes);
    }

    // â”€â”€ CÃ¡lculo de completitud â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private async Task<int> CalcularCompletitudAsync(int curriculumId, CancellationToken ct)
    {
        // Carga ligera: solo los conteos necesarios
        var tienePersonales = await _context.Personales
            .AnyAsync(p => p.CurriculumId == curriculumId
                        && p.PrimerNombre != string.Empty
                        && p.PrimerApellido != string.Empty, ct);

        var tienePerfiles = await _context.Perfiles
            .AnyAsync(p => p.CurriculumId == curriculumId, ct);

        var tieneExperiencias = await _context.Experiencias
            .AnyAsync(e => e.CurriculumId == curriculumId, ct);

        var tieneFormaciones = await _context.Formaciones
            .AnyAsync(f => f.CurriculumId == curriculumId, ct);

        var tieneHabilidades = await _context.Habilidades
            .AnyAsync(h => h.CurriculumId == curriculumId, ct);

        var tieneProyectos = await _context.Proyectos
            .AnyAsync(p => p.CurriculumId == curriculumId, ct);

        var tieneRedesSociales = await _context.RedesSociales
            .AnyAsync(r => r.CurriculumId == curriculumId, ct);

        // Pesos: total = 100
        var score = 0;
        if (tienePersonales)    score += 25;
        if (tienePerfiles)      score += 15;
        if (tieneExperiencias)  score += 20;
        if (tieneFormaciones)   score += 15;
        if (tieneHabilidades)   score += 15;
        if (tieneProyectos)     score += 5;
        if (tieneRedesSociales) score += 5;

        return score;
    }
}

