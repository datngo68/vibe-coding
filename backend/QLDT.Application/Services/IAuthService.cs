using QLDT.Application.DTOs.Auth;

namespace QLDT.Application.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<string?> RefreshTokenAsync(string refreshToken);
}
