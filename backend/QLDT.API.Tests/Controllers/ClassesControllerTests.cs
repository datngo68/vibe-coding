using System.Net;
using System.Net.Http.Json;
using System.Text;
using FluentAssertions;
using QLDT.API.Tests;
using QLDT.Application.DTOs.Class;
using Xunit;

namespace QLDT.API.Tests.Controllers;

public class ClassesControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private string? _authToken;

    public ClassesControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthTokenAsync()
    {
        if (_authToken != null) return _authToken;

        var loginRequest = new Application.DTOs.Auth.LoginRequest
        {
            Username = "testuser",
            Password = "password123"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
        var loginResponse = await response.Content.ReadFromJsonAsync<Application.DTOs.Auth.LoginResponse>();
        _authToken = loginResponse!.Token;
        return _authToken;
    }

    [Fact]
    public async Task GetClasses_WithoutAuth_ReturnsUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/classes");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetClasses_WithAuth_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/classes");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateClass_WithValidData_ReturnsCreated()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new CreateClassRequest
        {
            BranchId = 1,
            Name = "Test Class",
            Level = "Beginner"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/classes", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdClass = await response.Content.ReadFromJsonAsync<ClassDto>();
        createdClass.Should().NotBeNull();
        createdClass!.Name.Should().Be("Test Class");
        createdClass.Level.Should().Be("Beginner");
    }

    [Fact]
    public async Task GetClassById_WithValidId_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // First create a class
        var createRequest = new CreateClassRequest
        {
            BranchId = 1,
            Name = "Test Class for Get",
            Level = "Intermediate"
        };
        var createResponse = await _client.PostAsJsonAsync("/api/classes", createRequest);
        var createdClass = await createResponse.Content.ReadFromJsonAsync<ClassDto>();

        // Act
        var response = await _client.GetAsync($"/api/classes/{createdClass!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var classDto = await response.Content.ReadFromJsonAsync<ClassDto>();
        classDto.Should().NotBeNull();
        classDto!.Id.Should().Be(createdClass.Id);
        classDto.Name.Should().Be("Test Class for Get");
    }

    [Fact]
    public async Task GetClassById_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/classes/99999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateClass_WithValidData_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // First create a class
        var createRequest = new CreateClassRequest
        {
            BranchId = 1,
            Name = "Class to Update",
            Level = "Beginner"
        };
        var createResponse = await _client.PostAsJsonAsync("/api/classes", createRequest);
        var createdClass = await createResponse.Content.ReadFromJsonAsync<ClassDto>();

        // Update request
        var updateRequest = new CreateClassRequest
        {
            BranchId = 1,
            Name = "Updated Class Name",
            Level = "Advanced"
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/classes/{createdClass!.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedClass = await response.Content.ReadFromJsonAsync<ClassDto>();
        updatedClass.Should().NotBeNull();
        updatedClass!.Name.Should().Be("Updated Class Name");
        updatedClass.Level.Should().Be("Advanced");
    }

    [Fact]
    public async Task DeleteClass_WithValidId_ReturnsNoContent()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // First create a class
        var createRequest = new CreateClassRequest
        {
            BranchId = 1,
            Name = "Class to Delete",
            Level = "Beginner"
        };
        var createResponse = await _client.PostAsJsonAsync("/api/classes", createRequest);
        var createdClass = await createResponse.Content.ReadFromJsonAsync<ClassDto>();

        // Act
        var response = await _client.DeleteAsync($"/api/classes/{createdClass!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify it's deleted
        var getResponse = await _client.GetAsync($"/api/classes/{createdClass.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
