using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PortalCV.Application.DTOs.Admin;
using PortalCV.Application.DTOs.Auth;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class AuthAuditoriaService : IAuthAuditoriaService
{
    private readonly PortalCvDbContext _context;
    private readonly ILogger<AuthAuditoriaService> _logger;

    public AuthAuditoriaService(PortalCvDbContext context, ILogger<AuthAuditoriaService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task RegistrarAsync(
        int? actorUsuarioId,
        string accion,
        string email,
        IReadOnlyDictionary<string, string>? detalle,
        string? ipOrigen = null,
        CancellationToken ct = default)
    {
        try
        {
            var row = new AuditoriaAuth
            {
                FechaUtc = DateTime.UtcNow,
                ActorUsuarioId = actorUsuarioId,
                Accion = accion,
                Email = email,
                DetalleJson = detalle is { Count: > 0 }
                    ? JsonSerializer.Serialize(detalle)
                    : null,
                IpOrigen = ipOrigen
            };
            _context.Set<AuditoriaAuth>().Add(row);
            await _context.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            // No debe romper el flujo de login/logout si falla la auditoría.
            _logger.LogWarning(ex, "No se pudo registrar evento de auditoría de autenticación {Accion}", accion);
        }
    }

    public async Task<(IReadOnlyList<AuditoriaAuthListItemDto> Items, int Total)> ListarAsync(
        int page,
        int pageSize,
        string? accionFiltro = null,
        string? q = null,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize is < 1 or > 100) pageSize = 10;

        IQueryable<AuditoriaAuth> query = _context.Set<AuditoriaAuth>()
            .AsNoTracking()
            .Include(a => a.Actor);

        if (!string.IsNullOrWhiteSpace(accionFiltro))
        {
            var acc = accionFiltro.Trim();
            query = query.Where(a => a.Accion == acc);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var t = q.Trim();
            query = query.Where(a =>
                a.Email.Contains(t) ||
                (a.Actor != null && a.Actor.Email != null && a.Actor.Email.Contains(t)) ||
                a.Accion.Contains(t) ||
                (a.DetalleJson != null && a.DetalleJson.Contains(t)));
        }

        query = query.OrderByDescending(a => a.AuditoriaAuthId);

        var total = await query.CountAsync(ct);
        var rows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = rows.Select(a => new AuditoriaAuthListItemDto
        {
            AuditoriaAuthId = a.AuditoriaAuthId,
            FechaUtc = a.FechaUtc,
            ActorUsuarioId = a.ActorUsuarioId,
            ActorEmail = a.Actor?.Email,
            Accion = a.Accion,
            Email = a.Email,
            DetalleJson = a.DetalleJson,
            IpOrigen = a.IpOrigen
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
                     DELETE FROM dbo.AuditoriaAuth
                     WHERE DATEPART(year, FechaUtc) = {anio} AND DATEPART(month, FechaUtc) = {mes}
                     """,
                    ct);

            case AuditoriaPurgeModo.Anio:
                if (anio is < 2000 or > 2100)
                    throw new ArgumentException("Año fuera de rango.");
                return await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"""
                     DELETE FROM dbo.AuditoriaAuth
                     WHERE DATEPART(year, FechaUtc) = {anio}
                     """,
                    ct);

            case AuditoriaPurgeModo.Todo:
                return await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM dbo.AuditoriaAuth",
                    cancellationToken: ct);

            default:
                throw new ArgumentOutOfRangeException(nameof(modo), modo, null);
        }
    }
}
