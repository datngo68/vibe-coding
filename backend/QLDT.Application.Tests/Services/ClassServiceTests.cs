using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Class;
using QLDT.Application.Interfaces;
using QLDT.Application.Mappings;
using QLDT.Application.Services;
using QLDT.Domain.Entities;
using QLDT.Infrastructure.Data;
using QLDT.Application.Tests.Helpers;
using Xunit;

namespace QLDT.Application.Tests.Services;

public class ClassServiceTests : IDisposable
{
    private readonly IQLDTDbContext _context;
    private readonly QLDT.Application.Interfaces.IRepository<Class> _repository;
    private readonly QLDTDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ClassService _service;

    public ClassServiceTests()
    {
        var options = new DbContextOptionsBuilder<QLDTDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContext = new QLDTDbContext(options);
        _context = new QLDTDbContextAdapter(_dbContext);

        _repository = new TestRepository<Class>(_dbContext);

        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = mapperConfig.CreateMapper();

        _service = new ClassService(_repository, _context, _mapper);

        // Seed test data
        SeedTestData(_dbContext);
    }

    private void SeedTestData(QLDTDbContext dbContext)
    {
        var owner = new Owner { Id = 1, Name = "Test Owner", Email = "owner@test.com" };
        var branch = new Branch { Id = 1, OwnerId = 1, Name = "Test Branch", CreatedAt = DateTime.UtcNow };
        
        dbContext.Owners.Add(owner);
        dbContext.Branches.Add(branch);
        dbContext.Classes.Add(new Class 
        { 
            Id = 1, 
            BranchId = 1, 
            Name = "Class A", 
            Level = "Beginner",
            CreatedAt = DateTime.UtcNow
        });
        dbContext.SaveChanges();
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsClassDto()
    {
        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(1);
        result.Name.Should().Be("Class A");
        result.Level.Should().Be("Beginner");
        result.BranchId.Should().Be(1);
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ReturnsNull()
    {
        // Act
        var result = await _service.GetByIdAsync(999);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByBranchIdAsync_ReturnsClassesForBranch()
    {
        // Arrange - Create another class using the service
        var createRequest = new CreateClassRequest
        {
            BranchId = 1,
            Name = "Class B",
            Level = "Intermediate"
        };
        await _service.CreateAsync(createRequest);

        // Act
        var result = await _service.GetByBranchIdAsync(1);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThanOrEqualTo(2);
        result.Should().Contain(c => c.Name == "Class A");
        result.Should().Contain(c => c.Name == "Class B");
    }

    [Fact]
    public async Task CreateAsync_CreatesNewClass()
    {
        // Arrange
        var request = new CreateClassRequest
        {
            BranchId = 1,
            Name = "New Class",
            Level = "Intermediate"
        };

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.Name.Should().Be("New Class");
        result.Level.Should().Be("Intermediate");
        result.BranchId.Should().Be(1);
    }

    [Fact]
    public async Task UpdateAsync_WithValidId_UpdatesClass()
    {
        // Arrange
        var request = new CreateClassRequest
        {
            BranchId = 1,
            Name = "Updated Class",
            Level = "Advanced"
        };

        // Act
        var result = await _service.UpdateAsync(1, request);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Updated Class");
        result.Level.Should().Be("Advanced");
    }

    [Fact]
    public async Task UpdateAsync_WithInvalidId_ThrowsKeyNotFoundException()
    {
        // Arrange
        var request = new CreateClassRequest
        {
            BranchId = 1,
            Name = "Updated Class"
        };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UpdateAsync(999, request));
    }

    [Fact]
    public async Task DeleteAsync_WithValidId_DeletesClass()
    {
        // Act
        await _service.DeleteAsync(1);

        // Assert
        var deleted = await _service.GetByIdAsync(1);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_WithInvalidId_ThrowsKeyNotFoundException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.DeleteAsync(999));
    }

    public void Dispose()
    {
        // Cleanup is handled by InMemory database disposal
    }
}
