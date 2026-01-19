using QLDT.Application.DTOs.User;

namespace QLDT.Application.Services;

public interface IUserService
{
    Task<UserDto?> GetByIdAsync(int id);
    Task<UserDto?> GetCurrentUserAsync(int userId);
    Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request);
    Task ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<IEnumerable<UserDto>> GetAllAsync();
    Task<UserDto> CreateAsync(CreateUserRequest request);
    Task<UserDto> UpdateAsync(int id, CreateUserRequest request);
    Task DeleteAsync(int id);
    Task<IEnumerable<int>> GetStudentIdsByParentIdAsync(int parentId);
    Task AssignStudentsToParentAsync(int parentId, List<int> studentIds);
    Task ResetPasswordAsync(int userId, string newPassword);
    Task<IEnumerable<UserDto>> GetParentsAsync();
    Task<UserDto> ActivateAsync(int userId);
    Task<UserDto> DeactivateAsync(int userId);
}
