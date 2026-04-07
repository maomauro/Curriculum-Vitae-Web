using Microsoft.EntityFrameworkCore;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Repositories;

public class CurriculumRepository : GenericRepository<Curriculum>, ICurriculumRepository
{
    public CurriculumRepository(PortalCvDbContext context) : base(context) { }

    public async Task<Curriculum?> GetByUrlPublicaAsync(string urlPublica, CancellationToken ct = default)
        => await _dbSet
            .AsNoTracking()
            .Include(c => c.Personales)
            .Include(c => c.Perfiles)
            .Include(c => c.Experiencias)
            .Include(c => c.Formaciones)
            .Include(c => c.Habilidades)
            .Include(c => c.Proyectos)
            .Include(c => c.Referencias)
            .Include(c => c.RedesSociales)
            .Include(c => c.EstadisticasPublicas)
            .FirstOrDefaultAsync(c => c.UrlPublica == urlPublica && c.Estado == "Publicado", ct);

    public async Task<Curriculum?> GetByUsuarioIdAsync(int usuarioId, CancellationToken ct = default)
        => await _dbSet
            .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId, ct);

    public async Task<bool> UrlPublicaExisteAsync(string urlPublica, int? excludeCurriculumId = null, CancellationToken ct = default)
        => await _dbSet.AnyAsync(c =>
            c.UrlPublica == urlPublica &&
            (excludeCurriculumId == null || c.CurriculumId != excludeCurriculumId), ct);

    public async Task<(IReadOnlyList<Curriculum> Items, int Total)> BuscarPublicosAsync(
        string? ciudad,
        string? habilidad,
        string? palabraClave,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var query = _dbSet
            .AsNoTracking()
            .Where(c => c.Estado == "Publicado")
            .Include(c => c.Personales)
            .Include(c => c.Perfiles.Where(p => p.EsActivo))
            .Include(c => c.Habilidades)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(ciudad))
            query = query.Where(c => c.Personales != null && c.Personales.Ciudad == ciudad);

        if (!string.IsNullOrWhiteSpace(habilidad))
            query = query.Where(c => c.Habilidades.Any(h => h.Nombre == habilidad));

        if (!string.IsNullOrWhiteSpace(palabraClave))
        {
            var kw = palabraClave.ToLower();
            query = query.Where(c =>
                (c.Personales != null &&
                    (EF.Functions.Like(c.Personales.PrimerNombre.ToLower(), $"%{kw}%") ||
                     EF.Functions.Like(c.Personales.PrimerApellido.ToLower(), $"%{kw}%") ||
                     EF.Functions.Like((c.Personales.Ciudad ?? "").ToLower(), $"%{kw}%"))) ||
                c.Perfiles.Any(p => p.EsActivo && EF.Functions.Like((p.NombrePerfil ?? "").ToLower(), $"%{kw}%")) ||
                c.Habilidades.Any(h => EF.Functions.Like(h.Nombre.ToLower(), $"%{kw}%")));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(c => c.ContadorVisitas)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }
}
