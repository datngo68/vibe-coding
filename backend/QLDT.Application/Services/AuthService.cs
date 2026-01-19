using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using QLDT.Application.DTOs.Auth;
using QLDT.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace QLDT.Application.Services;

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByUsernameAsync(request.Username);

        if (user == null)
            return null;

        // Simple password verification (in production, use proper hashing)
        if (!VerifyPassword(request.Password, user.PasswordHash))
            return null;

        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        // In production, save refresh token to database
        return new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role.ToString(),
                BranchId = user.BranchId,
                TeacherId = user.TeacherId
            }
        };
    }

    public Task<string?> RefreshTokenAsync(string refreshToken)
    {
        // Implement refresh token logic
        return Task.FromResult<string?>(null);
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim("userId", user.Id.ToString()), // Custom claim for easier access
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("role", user.Role.ToString()) // Custom claim for easier access
        };

        if (user.BranchId.HasValue)
        {
            claims.Add(new Claim("BranchId", user.BranchId.Value.ToString()));
        }

        if (user.TeacherId.HasValue)
        {
            claims.Add(new Claim("TeacherId", user.TeacherId.Value.ToString()));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured")));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "60")),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private bool VerifyPassword(string password, string hash)
    {
        // Simple verification for development
        // In production, use BCrypt or similar
        return password == hash || BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
