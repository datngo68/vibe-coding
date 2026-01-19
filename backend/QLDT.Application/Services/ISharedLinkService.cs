using QLDT.Application.DTOs.SharedLink;

namespace QLDT.Application.Services;

public interface ISharedLinkService
{
    Task<IEnumerable<SharedLinkDto>> GetAllByUserIdAsync(int userId);
    Task<SharedLinkDto> CreateAsync(CreateSharedLinkRequest request, int userId);
    Task<SharedLinkDto?> GetByTokenAsync(string token);
    Task DeleteAsync(int id);
}
