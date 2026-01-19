using Microsoft.EntityFrameworkCore;
using QLDT.Infrastructure.Data;
using System.Linq;
using System.Linq.Expressions;

namespace QLDT.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly QLDTDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(QLDTDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        // Try to order by CreatedAt if exists, otherwise by Id (newest first)
        var query = _dbSet.AsQueryable();
        
        // Check if entity has CreatedAt property using reflection
        var createdAtProperty = typeof(T).GetProperty("CreatedAt");
        if (createdAtProperty != null && createdAtProperty.PropertyType == typeof(DateTime))
        {
            // Use dynamic ordering for CreatedAt
            query = query.OrderByDescending(x => EF.Property<DateTime>(x, "CreatedAt"));
        }
        else
        {
            // Fallback to Id ordering
            var idProperty = typeof(T).GetProperty("Id");
            if (idProperty != null && idProperty.PropertyType == typeof(int))
            {
                query = query.OrderByDescending(x => EF.Property<int>(x, "Id"));
            }
        }
        
        return await query.ToListAsync();
    }

    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        var query = _dbSet.Where(predicate);
        
        // Try to order by CreatedAt if exists, otherwise by Id (newest first)
        var createdAtProperty = typeof(T).GetProperty("CreatedAt");
        if (createdAtProperty != null && createdAtProperty.PropertyType == typeof(DateTime))
        {
            query = query.OrderByDescending(x => EF.Property<DateTime>(x, "CreatedAt"));
        }
        else
        {
            var idProperty = typeof(T).GetProperty("Id");
            if (idProperty != null && idProperty.PropertyType == typeof(int))
            {
                query = query.OrderByDescending(x => EF.Property<int>(x, "Id"));
            }
        }
        
        return await query.ToListAsync();
    }

    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public virtual async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    public virtual async Task DeleteAsync(T entity)
    {
        _dbSet.Remove(entity);
        await _context.SaveChangesAsync();
    }

    public virtual async Task<bool> ExistsAsync(int id)
    {
        var entity = await GetByIdAsync(id);
        return entity != null;
    }
}
