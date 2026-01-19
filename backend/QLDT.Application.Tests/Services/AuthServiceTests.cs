using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using QLDT.Application.DTOs.Auth;
using QLDT.Application.Services;
using QLDT.Domain.Entities;
using Xunit;

namespace QLDT.Application.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _configurationMock = new Mock<IConfiguration>();

        // Setup default JWT configuration
        _configurationMock.Setup(c => c["Jwt:SecretKey"]).Returns("ThisIsAStrongSecretKeyForQLDTSystemThatIsAtLeast32CharactersLong");
        _configurationMock.Setup(c => c["Jwt:Issuer"]).Returns("QLDTSystem");
        _configurationMock.Setup(c => c["Jwt:Audience"]).Returns("QLDTUsers");
        _configurationMock.Setup(c => c["Jwt:ExpirationMinutes"]).Returns("60");

        _authService = new AuthService(_userRepositoryMock.Object, _configurationMock.Object);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsLoginResponse()
    {
        // Arrange
        var username = "testuser";
        var password = "password123";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);
        
        var user = new User
        {
            Id = 1,
            Username = username,
            Email = "test@example.com",
            PasswordHash = hashedPassword,
            Role = UserRole.Teacher,
            BranchId = 1
        };

        _userRepositoryMock.Setup(r => r.GetByUsernameAsync(username))
            .ReturnsAsync(user);

        var request = new LoginRequest
        {
            Username = username,
            Password = password
        };

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.User.Should().NotBeNull();
        result.User.Username.Should().Be(username);
        result.User.Email.Should().Be(user.Email);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidUsername_ReturnsNull()
    {
        // Arrange
        _userRepositoryMock.Setup(r => r.GetByUsernameAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        var request = new LoginRequest
        {
            Username = "nonexistent",
            Password = "password123"
        };

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ReturnsNull()
    {
        // Arrange
        var username = "testuser";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword("correctpassword");
        
        var user = new User
        {
            Id = 1,
            Username = username,
            Email = "test@example.com",
            PasswordHash = hashedPassword,
            Role = UserRole.Teacher
        };

        _userRepositoryMock.Setup(r => r.GetByUsernameAsync(username))
            .ReturnsAsync(user);

        var request = new LoginRequest
        {
            Username = username,
            Password = "wrongpassword"
        };

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_GeneratesValidJwtToken()
    {
        // Arrange
        var username = "testuser";
        var password = "password123";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);
        
        var user = new User
        {
            Id = 1,
            Username = username,
            Email = "test@example.com",
            PasswordHash = hashedPassword,
            Role = UserRole.Owner,
            BranchId = 1
        };

        _userRepositoryMock.Setup(r => r.GetByUsernameAsync(username))
            .ReturnsAsync(user);

        var request = new LoginRequest
        {
            Username = username,
            Password = password
        };

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrEmpty();
        
        // Verify token can be decoded
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(result.Token);
        token.Claims.Should().Contain(c => c.Type == System.Security.Claims.ClaimTypes.Name && c.Value == username);
        token.Claims.Should().Contain(c => c.Type == System.Security.Claims.ClaimTypes.Role && c.Value == "Owner");
    }
}
