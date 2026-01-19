using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QLDT.Infrastructure.Data;

namespace QLDT.API.Tests;

public class CustomWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the production DbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<QLDTDbContext>));

            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Add in-memory database
            services.AddDbContext<QLDTDbContext>(options =>
            {
                options.UseInMemoryDatabase("TestDb_" + Guid.NewGuid().ToString());
            });
        });
    }

    private void SeedTestData(QLDTDbContext context)
    {
        // Add test data here if needed
        if (!context.Owners.Any())
        {
            context.Owners.Add(new Domain.Entities.Owner
            {
                Id = 1,
                Name = "Test Owner",
                Email = "owner@test.com"
            });
        }

        if (!context.Branches.Any())
        {
            context.Branches.Add(new Domain.Entities.Branch
            {
                Id = 1,
                OwnerId = 1,
                Name = "Test Branch",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!context.Users.Any())
        {
            context.Users.Add(new Domain.Entities.User
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                Role = Domain.Entities.UserRole.Teacher,
                BranchId = 1
            });
        }

        context.SaveChanges();
    }
}
