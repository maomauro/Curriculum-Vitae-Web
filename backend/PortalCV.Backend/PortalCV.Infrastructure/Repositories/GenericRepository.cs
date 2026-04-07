using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using PortalCV.Application.Interfaces;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Repositories;

public class GenericRepository<T> : IRepository<T> where T : class
{
    protected readonly PortalCvDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public GenericRepository(PortalCvDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _dbSet.FindAsync(new object[] { id }, ct);

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default)
        => await _dbSet.AsNoTracking().ToListAsync(ct);

    public async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        => await _dbSet.AsNoTracking().Where(predicate).ToListAsync(ct);

    public async Task AddAsync(T entity, CancellationToken ct = default)
        => await _dbSet.AddAsync(entity, ct);

    public void Update(T entity)
        => _dbSet.Update(entity);

    public void Remove(T entity)
        => _dbSet.Remove(entity);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}
