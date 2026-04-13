using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PortalCV.Application.DTOs.Admin;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class CvAuditoriaService : ICvAuditoriaService
{
    private readonly PortalCvDbContext _context;
    private readonly ILogger<CvAuditoriaService> _logger;

    public CvAuditoriaService(PortalCvDbContext context, ILogger<CvAuditoriaService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task RegistrarAsync(
        int? actorUsuarioId,
        int curriculumId,
        string accion,
        string entidadTipo,
        int? entidadId,
        IReadOnlyDictionary<string, string>? detalle,
        CancellationToken ct = default)
    {
        if (actorUsuarioId is null or <= 0)
            return;

        try
        {
            var row = new AuditoriaCv
            {
                FechaUtc = DateTime.UtcNow,
                ActorUsuarioId = actorUsuarioId,
                CurriculumId = curriculumId,
                Accion = accion,
                EntidadTipo = entidadTipo,
                EntidadId = entidadId,
                DetalleJson = detalle is { Count: > 0 }
                    ? JsonSerializer.Serialize(detalle)
                    : null
            };
            _context.Set<AuditoriaCv>().Add(row);
            await _context.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo registrar evento de auditoría CV {Accion}", accion);
        }
    }

    public async Task<(IReadOnlyList<AuditoriaCvListItemDto> Items, int Total)> ListarGlobalAsync(
        int page,
        int pageSize,
        string? accionFiltro = null,
        string? q = null,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize is < 1 or > 100) pageSize = 10;

        IQueryable<AuditoriaCv> query = _context.Set<AuditoriaCv>()
            .AsNoTracking()
            .Include(a => a.Actor)
            .Include(a => a.Curriculum)
            .ThenInclude(c => c!.Usuario);

        if (!string.IsNullOrWhiteSpace(accionFiltro))
        {
            var acc = accionFiltro.Trim();
            query = query.Where(a => a.Accion == acc);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var t = q.Trim();
            query = query.Where(a =>
                (a.Actor != null && a.Actor.Email != null && a.Actor.Email.Contains(t)) ||
                (a.Curriculum != null && a.Curriculum.Usuario != null && a.Curriculum.Usuario.Email != null &&
                 a.Curriculum.Usuario.Email.Contains(t)) ||
                (a.Curriculum != null && a.Curriculum.UrlPublica != null && a.Curriculum.UrlPublica.Contains(t)) ||
                a.Accion.Contains(t) ||
                a.EntidadTipo.Contains(t) ||
                (a.DetalleJson != null && a.DetalleJson.Contains(t)));
        }

        query = query.OrderByDescending(a => a.AuditoriaCvId);

        var total = await query.CountAsync(ct);
        var rows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = rows.Select(a => new AuditoriaCvListItemDto
        {
            AuditoriaCvId = a.AuditoriaCvId,
            FechaUtc = a.FechaUtc,
            ActorUsuarioId = a.ActorUsuarioId,
            ActorEmail = a.Actor?.Email,
            CurriculumId = a.CurriculumId,
            Accion = a.Accion,
            EntidadTipo = a.EntidadTipo,
            EntidadId = a.EntidadId,
            DetalleJson = a.DetalleJson,
            PropietarioEmail = a.Curriculum?.Usuario?.Email,
            UrlPublica = a.Curriculum?.UrlPublica
        }).ToList();

        return (items, total);
    }

    public async Task<int> PurgeAsync(AuditoriaPurgeModo modo, int? anio, int? mes, CancellationToken ct = default)
    {
        switch (modo)
        {
            case AuditoriaPurgeModo.AnioMes:
                if (anio is < 2000 or > 2100 || mes is < 1 or > 12)
                    throw new ArgumentException("Año o mes fuera de rango.");
                return await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"""
                     DELETE FROM dbo.AuditoriaCv
                     WHERE DATEPART(year, FechaUtc) = {anio} AND DATEPART(month, FechaUtc) = {mes}
                     """,
                    ct);

            case AuditoriaPurgeModo.Anio:
                if (anio is < 2000 or > 2100)
                    throw new ArgumentException("Año fuera de rango.");
                return await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"""
                     DELETE FROM dbo.AuditoriaCv
                     WHERE DATEPART(year, FechaUtc) = {anio}
                     """,
                    ct);

            case AuditoriaPurgeModo.Todo:
                return await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM dbo.AuditoriaCv",
                    cancellationToken: ct);

            default:
                throw new ArgumentOutOfRangeException(nameof(modo), modo, null);
        }
    }
}
