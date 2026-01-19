using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Student;
using QLDT.Application.Interfaces;
using QLDT.Application.Mappings;
using QLDT.Application.Services;
using QLDT.Domain.Entities;
using QLDT.Infrastructure.Data;
using QLDT.Application.Tests.Helpers;
using Xunit;

namespace QLDT.Application.Tests.Services;

public class StudentServiceTests : IDisposable
{
    private readonly IQLDTDbContext _context;
    private readonly IRepository<Student> _repository;
    private readonly QLDTDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly StudentService _service;

    public StudentServiceTests()
    {
        var options = new DbContextOptionsBuilder<QLDTDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContext = new QLDTDbContext(options);
        _context = new QLDTDbContextAdapter(_dbContext);

        _repository = new TestRepository<Student>(_dbContext);

        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = mapperConfig.CreateMapper();

        _service = new StudentService(_repository, _context, _mapper);

        // Seed test data
        SeedTestData(_dbContext);
    }

    private void SeedTestData(QLDTDbContext dbContext)
    {
        var owner = new Owner { Id = 1, Name = "Test Owner", Email = "owner@test.com" };
        var branch = new Branch { Id = 1, OwnerId = 1, Name = "Test Branch", CreatedAt = DateTime.UtcNow };
        var classEntity = new Class
        {
            Id = 1,
            BranchId = 1,
            Name = "Class A",
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Owners.Add(owner);
        dbContext.Branches.Add(branch);
        dbContext.Classes.Add(classEntity);
        dbContext.Students.Add(new Student
        {
            Id = 1,
            ClassId = 1,
            Name = "Student A",
            ParentName = "Parent A",
            ParentPhone = "123456789",
            CreatedAt = DateTime.UtcNow
        });
        dbContext.SaveChanges();
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsStudentDto()
    {
        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(1);
        result.Name.Should().Be("Student A");
        result.ParentName.Should().Be("Parent A");
        result.ClassId.Should().Be(1);
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
    public async Task GetByClassIdAsync_ReturnsStudentsForClass()
    {
        // Arrange - Create another student
        var createRequest = new CreateStudentRequest
        {
            ClassId = 1,
            Name = "Student B",
            ParentName = "Parent B"
        };
        await _service.CreateAsync(createRequest);

        // Act
        var result = await _service.GetByClassIdAsync(1);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThanOrEqualTo(2);
        result.Should().Contain(s => s.Name == "Student A");
        result.Should().Contain(s => s.Name == "Student B");
    }

    [Fact]
    public async Task CreateAsync_CreatesNewStudent()
    {
        // Arrange
        var request = new CreateStudentRequest
        {
            ClassId = 1,
            Name = "New Student",
            ParentName = "New Parent",
            ParentPhone = "987654321",
            ParentEmail = "parent@test.com"
        };

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.Name.Should().Be("New Student");
        result.ParentName.Should().Be("New Parent");
        result.ParentPhone.Should().Be("987654321");
        result.ClassId.Should().Be(1);
    }

    [Fact]
    public async Task UpdateAsync_WithValidId_UpdatesStudent()
    {
        // Arrange
        var request = new CreateStudentRequest
        {
            ClassId = 1,
            Name = "Updated Student",
            ParentName = "Updated Parent",
            ParentPhone = "111222333"
        };

        // Act
        var result = await _service.UpdateAsync(1, request);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Updated Student");
        result.ParentName.Should().Be("Updated Parent");
        result.ParentPhone.Should().Be("111222333");
    }

    [Fact]
    public async Task UpdateAsync_WithInvalidId_ThrowsKeyNotFoundException()
    {
        // Arrange
        var request = new CreateStudentRequest
        {
            ClassId = 1,
            Name = "Updated Student"
        };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UpdateAsync(999, request));
    }

    [Fact]
    public async Task DeleteAsync_WithValidId_DeletesStudent()
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
