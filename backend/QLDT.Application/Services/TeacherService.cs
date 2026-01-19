using AutoMapper;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Teacher;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;

namespace QLDT.Application.Services;

public class TeacherService : ITeacherService
{
    private readonly IRepository<Teacher> _teacherRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IQLDTDbContext _context;
    private readonly IMapper _mapper;

    public TeacherService(
        IRepository<Teacher> teacherRepository,
        IRepository<User> userRepository,
        IQLDTDbContext context,
        IMapper mapper)
    {
        _teacherRepository = teacherRepository;
        _userRepository = userRepository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<TeacherDto>> GetAllAsync()
    {
        var teachers = await _context.Teachers
            .Include(t => t.Branch)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<TeacherDto>>(teachers);
    }

    public async Task<TeacherDto?> GetByIdAsync(int id)
    {
        var teacher = await _context.Teachers
            .Include(t => t.Branch)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (teacher == null) return null;
        return _mapper.Map<TeacherDto>(teacher);
    }

    public async Task<IEnumerable<TeacherDto>> GetByBranchIdAsync(int branchId)
    {
        var teachers = await _context.Teachers
            .Include(t => t.Branch)
            .Where(t => t.BranchId == branchId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<TeacherDto>>(teachers);
    }

    public async Task<TeacherDto> CreateAsync(CreateTeacherRequest request)
    {
        var teacher = _mapper.Map<Teacher>(request);
        var created = await _teacherRepository.AddAsync(teacher);

        await _context.Entry(created).Reference(t => t.Branch).LoadAsync();

        return _mapper.Map<TeacherDto>(created);
    }

    public async Task<TeacherDto> CreateWithAccountAsync(CreateTeacherWithAccountRequest request)
    {
        // Check if username or email already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Email);

        if (existingUser != null)
        {
            throw new InvalidOperationException("Username hoặc email đã tồn tại");
        }

        // Create Teacher entity
        var teacher = new Teacher
        {
            BranchId = request.BranchId,
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            CreatedAt = DateTime.UtcNow
        };

        var createdTeacher = await _teacherRepository.AddAsync(teacher);

        // Create User account for Teacher
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Teacher,
            BranchId = request.BranchId,
            TeacherId = createdTeacher.Id,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);

        await _context.Entry(createdTeacher).Reference(t => t.Branch).LoadAsync();

        return _mapper.Map<TeacherDto>(createdTeacher);
    }

    public async Task<TeacherDto> UpdateAsync(int id, CreateTeacherRequest request)
    {
        var teacher = await _teacherRepository.GetByIdAsync(id);
        if (teacher == null)
            throw new KeyNotFoundException($"Teacher with id {id} not found");

        _mapper.Map(request, teacher);
        await _teacherRepository.UpdateAsync(teacher);

        await _context.Entry(teacher).Reference(t => t.Branch).LoadAsync();

        return _mapper.Map<TeacherDto>(teacher);
    }

    public async Task DeleteAsync(int id)
    {
        var teacher = await _teacherRepository.GetByIdAsync(id);
        if (teacher == null)
            throw new KeyNotFoundException($"Teacher with id {id} not found");

        await _teacherRepository.DeleteAsync(teacher);
    }
}
