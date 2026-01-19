using Microsoft.EntityFrameworkCore;
using QLDT.Domain.Entities;
using QLDT.Infrastructure.Data;

namespace QLDT.Infrastructure.Repositories;

public class UserRepository : Repository<User>, QLDT.Application.Services.IUserRepository
{
    public UserRepository(QLDTDbContext context) : base(context)
    {
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _dbSet
            .Include(u => u.Branch)
            .FirstOrDefaultAsync(u => u.Username == username);
    }
}
