using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using QLDT.API.Tests;
using QLDT.Application.DTOs.Auth;
using Xunit;

namespace QLDT.API.Tests.Controllers;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public AuthControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkWithToken()
    {
        // Arrange
        var request = new LoginRequest
        {
            Username = "testuser",
            Password = "password123"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponse>();
        loginResponse.Should().NotBeNull();
        loginResponse!.Token.Should().NotBeNullOrEmpty();
        loginResponse.RefreshToken.Should().NotBeNullOrEmpty();
        loginResponse.User.Should().NotBeNull();
        loginResponse.User.Username.Should().Be("testuser");
    }

    [Fact]
    public async Task Login_WithInvalidUsername_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest
        {
            Username = "nonexistent",
            Password = "password123"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest
        {
            Username = "testuser",
            Password = "wrongpassword"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithMissingFields_ReturnsBadRequest()
    {
        // Arrange
        var request = new { }; // Missing username and password

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
