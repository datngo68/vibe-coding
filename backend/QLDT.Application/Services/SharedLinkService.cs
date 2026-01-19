using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using QLDT.Application.DTOs.SharedLink;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;
using System;

namespace QLDT.Application.Services;

public class SharedLinkService : ISharedLinkService
{
    private readonly IRepository<SharedLink> _sharedLinkRepository;
    private readonly IQLDTDbContext _context;
    private readonly IConfiguration _configuration;

    public SharedLinkService(
        IRepository<SharedLink> sharedLinkRepository,
        IQLDTDbContext context,
        IConfiguration configuration)
    {
        _sharedLinkRepository = sharedLinkRepository;
        _context = context;
        _configuration = configuration;
    }

    public async Task<IEnumerable<SharedLinkDto>> GetAllByUserIdAsync(int userId)
    {
        var frontendUrl = _configuration["FrontendUrl"] ?? _configuration["BaseUrl"] ?? "http://localhost:5173";
        
        var sharedLinks = await _context.SharedLinks
            .Where(sl => sl.CreatedBy == userId)
            .OrderByDescending(sl => sl.CreatedAt)
            .ToListAsync();

        return sharedLinks.Select(sl => new SharedLinkDto
        {
            Id = sl.Id,
            EntityType = sl.EntityType,
            EntityId = sl.EntityId,
            Token = sl.Token,
            ShareUrl = $"{frontendUrl}/shared/{sl.Token}",
            ExpiresAt = sl.ExpiresAt,
            CreatedAt = sl.CreatedAt
        });
    }

    public async Task<SharedLinkDto> CreateAsync(CreateSharedLinkRequest request, int userId)
    {
        var token = Guid.NewGuid().ToString("N");
        var frontendUrl = _configuration["FrontendUrl"] ?? _configuration["BaseUrl"] ?? "http://localhost:5173";

        var sharedLink = new SharedLink
        {
            EntityType = request.EntityType,
            EntityId = request.EntityId,
            Token = token,
            ExpiresAt = request.ExpiresAt,
            CreatedBy = userId
        };

        var created = await _sharedLinkRepository.AddAsync(sharedLink);

        return new SharedLinkDto
        {
            Id = created.Id,
            EntityType = created.EntityType,
            EntityId = created.EntityId,
            Token = created.Token,
            ShareUrl = $"{frontendUrl}/shared/{created.Token}",
            ExpiresAt = created.ExpiresAt,
            CreatedAt = created.CreatedAt
        };
    }

    public async Task<SharedLinkDto?> GetByTokenAsync(string token)
    {
        var sharedLink = await _context.SharedLinks
            .FirstOrDefaultAsync(sl => sl.Token == token);

        if (sharedLink == null)
            return null;

        // Check expiration
        if (sharedLink.ExpiresAt.HasValue && sharedLink.ExpiresAt.Value < DateTime.UtcNow)
            return null;

        var frontendUrl = _configuration["FrontendUrl"] ?? _configuration["BaseUrl"] ?? "http://localhost:5173";

        return new SharedLinkDto
        {
            Id = sharedLink.Id,
            EntityType = sharedLink.EntityType,
            EntityId = sharedLink.EntityId,
            Token = sharedLink.Token,
            ShareUrl = $"{frontendUrl}/shared/{sharedLink.Token}",
            ExpiresAt = sharedLink.ExpiresAt,
            CreatedAt = sharedLink.CreatedAt
        };
    }

    public async Task DeleteAsync(int id)
    {
        var sharedLink = await _sharedLinkRepository.GetByIdAsync(id);
        if (sharedLink == null)
            throw new KeyNotFoundException($"SharedLink with id {id} not found");

        await _sharedLinkRepository.DeleteAsync(sharedLink);
    }
}
