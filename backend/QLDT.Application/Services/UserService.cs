using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QLDT.Application.DTOs.User;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;
using System.Security.Claims;

namespace QLDT.Application.Services;

public class UserService : IUserService
{
    private readonly IQLDTDbContext _context;
    private readonly IMapper _mapper;
    private readonly IServiceProvider _serviceProvider;

    public UserService(IQLDTDbContext context, IMapper mapper, IServiceProvider serviceProvider)
    {
        _context = context;
        _mapper = mapper;
        _serviceProvider = serviceProvider;
    }

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var user = await _context.Users
            .Include(u => u.Branch)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return null;
        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto?> GetCurrentUserAsync(int userId)
    {
        return await GetByIdAsync(userId);
    }

    public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new KeyNotFoundException($"User with id {userId} not found");

        // Check if username already exists (excluding current user)
        if (await _context.Users.AnyAsync(u => u.Id != userId && u.Username == request.Username))
            throw new InvalidOperationException("Username already exists");

        // Check if email already exists (only if email is provided and not empty)
        if (!string.IsNullOrWhiteSpace(request.Email) &&
            await _context.Users.AnyAsync(u => u.Id != userId && !string.IsNullOrWhiteSpace(u.Email) && u.Email == request.Email))
            throw new InvalidOperationException("Email already exists");

        user.Username = request.Username;
        user.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();

        await _context.SaveChangesAsync();
        return _mapper.Map<UserDto>(user);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new KeyNotFoundException($"User with id {userId} not found");

        // Verify current password
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash) &&
            request.CurrentPassword != user.PasswordHash) // Fallback for old passwords
            throw new UnauthorizedAccessException("Current password is incorrect");

        // Hash new password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync()
    {
        var users = await _context.Users
            .Include(u => u.Branch)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<UserDto>>(users);
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request)
    {
        // Check if username already exists
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            throw new InvalidOperationException("Username already exists");

        // Check if email already exists (only if email is provided and not empty)
        if (!string.IsNullOrWhiteSpace(request.Email) &&
            await _context.Users.AnyAsync(u => !string.IsNullOrWhiteSpace(u.Email) && u.Email == request.Email))
            throw new InvalidOperationException("Email already exists");

        int? finalTeacherId = request.TeacherId;

        // If role is Teacher and TeacherId is not set, create Teacher entity automatically
        if (request.Role == "Teacher" && (!request.TeacherId.HasValue || request.TeacherId.Value == 0))
        {
            if (!request.BranchId.HasValue || request.BranchId.Value == 0)
                throw new InvalidOperationException("BranchId is required when creating Teacher user");

            // Create Teacher entity
            var teacher = new Teacher
            {
                BranchId = request.BranchId.Value,
                Name = string.IsNullOrWhiteSpace(request.FullName) ? request.Username : request.FullName,
                Email = string.IsNullOrWhiteSpace(request.Email) ? string.Empty : request.Email,
                Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone,
                CreatedAt = DateTime.UtcNow
            };

            _context.Teachers.Add(teacher);
            await _context.SaveChangesAsync();
            finalTeacherId = teacher.Id;
        }

        var user = new User
        {
            Username = request.Username,
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = string.IsNullOrWhiteSpace(request.FullName) ? null : request.FullName,
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone,
            Role = Enum.Parse<UserRole>(request.Role),
            BranchId = request.BranchId,
            TeacherId = finalTeacherId,
            IsActive = request.IsActive
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // If role is Teacher and TeacherId is set, assign teacher to classes
        if (request.Role == "Teacher" && finalTeacherId.HasValue && request.ClassIds != null && request.ClassIds.Count > 0)
        {
            var classService = _serviceProvider.GetRequiredService<IClassService>();
            foreach (var classId in request.ClassIds)
            {
                try
                {
                    await classService.AssignTeacherAsync(classId, finalTeacherId.Value);
                }
                catch
                {
                    // Skip if assignment fails (e.g., already assigned or class doesn't exist)
                    // Continue with other assignments
                }
            }
        }

        await _context.Entry(user).Reference(u => u.Branch).LoadAsync();
        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> UpdateAsync(int id, CreateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            throw new KeyNotFoundException($"User with id {id} not found");

        // Check if username already exists (excluding current user)
        if (await _context.Users.AnyAsync(u => u.Id != id && u.Username == request.Username))
            throw new InvalidOperationException("Username already exists");

        // Check if email already exists (only if email is provided)
        if (!string.IsNullOrWhiteSpace(request.Email) &&
            await _context.Users.AnyAsync(u => u.Id != id && u.Email == request.Email))
            throw new InvalidOperationException("Email already exists");

        user.Username = request.Username;
        user.Email = string.IsNullOrWhiteSpace(request.Email) ? string.Empty : request.Email;
        user.FullName = string.IsNullOrWhiteSpace(request.FullName) ? null : request.FullName;
        user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone;
        if (!string.IsNullOrEmpty(request.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }
        user.Role = Enum.Parse<UserRole>(request.Role);
        user.BranchId = request.BranchId;
        user.TeacherId = request.TeacherId;
        user.IsActive = request.IsActive;

        await _context.SaveChangesAsync();
        await _context.Entry(user).Reference(u => u.Branch).LoadAsync();
        return _mapper.Map<UserDto>(user);
    }

    public async Task DeleteAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            throw new KeyNotFoundException($"User with id {id} not found");

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<int>> GetStudentIdsByParentIdAsync(int parentId)
    {
        return await _context.StudentParents
            .Where(sp => sp.ParentUserId == parentId)
            .Select(sp => sp.StudentId)
            .ToListAsync();
    }

    public async Task AssignStudentsToParentAsync(int parentId, List<int> studentIds)
    {
        // Remove existing assignments
        var existing = await _context.StudentParents
            .Where(sp => sp.ParentUserId == parentId)
            .ToListAsync();
        _context.StudentParents.RemoveRange(existing);

        // Add new assignments
        var newAssignments = studentIds.Select(studentId => new StudentParent
        {
            ParentUserId = parentId,
            StudentId = studentId
        });

        _context.StudentParents.AddRange(newAssignments);
        await _context.SaveChangesAsync();
    }

    public async Task ResetPasswordAsync(int userId, string newPassword)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new KeyNotFoundException($"User with id {userId} not found");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<UserDto>> GetParentsAsync()
    {
        var parents = await _context.Users
            .Where(u => u.Role == UserRole.Parent)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<UserDto>>(parents);
    }

    public async Task<UserDto> ActivateAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new KeyNotFoundException($"User with id {userId} not found");

        user.IsActive = true;
        await _context.SaveChangesAsync();

        await _context.Entry(user).Reference(u => u.Branch).LoadAsync();
        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> DeactivateAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new KeyNotFoundException($"User with id {userId} not found");

        user.IsActive = false;
        await _context.SaveChangesAsync();

        await _context.Entry(user).Reference(u => u.Branch).LoadAsync();
        return _mapper.Map<UserDto>(user);
    }
}
