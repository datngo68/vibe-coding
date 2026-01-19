using System.Linq.Expressions;
using QLDT.Application.Interfaces;

namespace QLDT.Application.Tests.Helpers;

public class TestRepository<T> : IRepository<T> where T : class
{
    private readonly Microsoft.EntityFrameworkCore.DbSet<T> _dbSet;
    private readonly Microsoft.EntityFrameworkCore.DbContext _context;

    public TestRepository(Microsoft.EntityFrameworkCore.DbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public Task<T?> GetByIdAsync(int id)
    {
        return _dbSet.FindAsync(id).AsTask();
    }

    public Task<IEnumerable<T>> GetAllAsync()
    {
        return Task.FromResult<IEnumerable<T>>(_dbSet.ToList());
    }

    public Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return Task.FromResult<IEnumerable<T>>(_dbSet.Where(predicate).ToList());
    }

    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(T entity)
    {
        _dbSet.Remove(entity);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(int id)
    {
        var entity = await GetByIdAsync(id);
        return entity != null;
    }
}
