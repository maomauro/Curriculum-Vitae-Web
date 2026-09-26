using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PortalCV.Application.Constants;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Repositories;

public class PromptIaRepository : IPromptIaRepository
{
    private const string CachePrefix = "prompt_ia:activo:";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);

    private readonly PortalCvDbContext _context;
    private readonly IMemoryCache _cache;

    public PromptIaRepository(PortalCvDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<PromptIa?> GetActivoPorCodigoAsync(int curriculumId, string codigo, CancellationToken ct = default)
    {
        var cacheKey = CacheKey(curriculumId, codigo);
        if (_cache.TryGetValue(cacheKey, out PromptIa? cached))
            return cached;

        var activo = await _context.PromptsIa
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.CurriculumId == curriculumId && x.Codigo == codigo && x.EsActivo, ct);

        _cache.Set(cacheKey, activo, CacheDuration);
        return activo;
    }

    public async Task<IReadOnlyList<PromptIa>> ListarActivosAsync(int curriculumId, CancellationToken ct = default)
        => await _context.PromptsIa
            .AsNoTracking()
            .Where(x => x.CurriculumId == curriculumId && x.EsActivo)
            .OrderBy(x => x.Codigo)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<PromptIa>> ListarVersionesPorCodigoAsync(int curriculumId, string codigo, CancellationToken ct = default)
        => await _context.PromptsIa
            .AsNoTracking()
            .Where(x => x.CurriculumId == curriculumId && x.Codigo == codigo)
            .OrderByDescending(x => x.Version)
            .ToListAsync(ct);

    public async Task<bool> ExisteCodigoAsync(int curriculumId, string codigo, CancellationToken ct = default)
        => await _context.PromptsIa.AsNoTracking().AnyAsync(x => x.CurriculumId == curriculumId && x.Codigo == codigo, ct);

    public async Task<PromptIa> GuardarNuevaVersionAsync(PromptIa version, CancellationToken ct = default)
    {
        var actual = await _context.PromptsIa
            .FirstOrDefaultAsync(x => x.CurriculumId == version.CurriculumId && x.Codigo == version.Codigo && x.EsActivo, ct);

        version.Version = (actual?.Version ?? 0) + 1;
        version.EsActivo = true;
        version.FechaCreacion = DateTime.UtcNow;

        // Dos SaveChanges separados a propósito: el índice único filtrado (EsActivo=1
        // por CurriculumId+Codigo) se valida por sentencia -- si el INSERT de la nueva
        // version activa sale antes que el UPDATE que desactiva la anterior dentro del
        // mismo lote, choca con la fila que aún sigue activa.
        if (actual is not null)
        {
            actual.EsActivo = false;
            await _context.SaveChangesAsync(ct);
        }

        _context.PromptsIa.Add(version);
        await _context.SaveChangesAsync(ct);

        InvalidarCache(version.CurriculumId, version.Codigo);
        return version;
    }

    public async Task<PromptIa> ActivarVersionAsync(int curriculumId, int promptIaId, CancellationToken ct = default)
    {
        var version = await _context.PromptsIa
            .FirstOrDefaultAsync(x => x.CurriculumId == curriculumId && x.PromptIaId == promptIaId, ct)
            ?? throw new KeyNotFoundException(ApiMessages.PromptIa.VersionNoEncontrada);

        if (!version.EsActivo)
        {
            var actual = await _context.PromptsIa
                .FirstOrDefaultAsync(x => x.CurriculumId == curriculumId && x.Codigo == version.Codigo && x.EsActivo, ct);
            if (actual is not null)
            {
                actual.EsActivo = false;
                await _context.SaveChangesAsync(ct);
            }

            version.EsActivo = true;
            await _context.SaveChangesAsync(ct);
            InvalidarCache(curriculumId, version.Codigo);
        }

        return version;
    }

    private void InvalidarCache(int curriculumId, string codigo) => _cache.Remove(CacheKey(curriculumId, codigo));

    private static string CacheKey(int curriculumId, string codigo) => $"{CachePrefix}{curriculumId}:{codigo}";
}
