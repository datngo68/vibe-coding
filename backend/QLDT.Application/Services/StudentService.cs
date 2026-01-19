using AutoMapper;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Student;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;

namespace QLDT.Application.Services;

public class StudentService : IStudentService
{
    private readonly IRepository<Student> _studentRepository;
    private readonly IQLDTDbContext _context;
    private readonly IMapper _mapper;

    public StudentService(
        IRepository<Student> studentRepository,
        IQLDTDbContext context,
        IMapper mapper)
    {
        _studentRepository = studentRepository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<StudentDto?> GetByIdAsync(int id)
    {
        var student = await _context.Students
            .Include(s => s.Class)
            .FirstOrDefaultAsync(s => s.Id == id);
        
        if (student == null) return null;
        
        var studentDto = _mapper.Map<StudentDto>(student);
        
        // Get parent user information if exists
        var parentRelation = await _context.StudentParents
            .Where(sp => sp.StudentId == id)
            .FirstOrDefaultAsync();
        
        if (parentRelation != null)
        {
            var parentUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == parentRelation.ParentUserId);
            
            if (parentUser != null)
            {
                studentDto.ParentUser = new ParentUserDto
                {
                    Id = parentUser.Id,
                    Username = parentUser.Username,
                    Email = parentUser.Email,
                    FullName = parentUser.FullName,
                    Phone = parentUser.Phone
                };
            }
        }
        
        return studentDto;
    }

    public async Task<IEnumerable<StudentDto>> GetByClassIdAsync(int classId)
    {
        var students = await _context.Students
            .Include(s => s.Class)
            .Where(s => s.ClassId == classId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var studentDtos = _mapper.Map<IEnumerable<StudentDto>>(students).ToList();
        
        // Get all parent relations for these students
        var studentIds = studentDtos.Select(s => s.Id).ToList();
        var parentRelations = await _context.StudentParents
            .Where(sp => studentIds.Contains(sp.StudentId))
            .ToListAsync();
        
        // Get all parent users
        var parentUserIds = parentRelations.Select(pr => pr.ParentUserId).Distinct().ToList();
        var parentUsers = await _context.Users
            .Where(u => parentUserIds.Contains(u.Id))
            .ToListAsync();
        
        // Map parent users to students
        foreach (var studentDto in studentDtos)
        {
            var parentRelation = parentRelations.FirstOrDefault(pr => pr.StudentId == studentDto.Id);
            if (parentRelation != null)
            {
                var parentUser = parentUsers.FirstOrDefault(u => u.Id == parentRelation.ParentUserId);
                if (parentUser != null)
                {
                    studentDto.ParentUser = new ParentUserDto
                    {
                        Id = parentUser.Id,
                        Username = parentUser.Username,
                        Email = parentUser.Email ?? string.Empty,
                        FullName = parentUser.FullName,
                        Phone = parentUser.Phone
                    };
                }
            }
        }
        
        return studentDtos;
    }

    public async Task<IEnumerable<StudentDto>> GetByParentIdAsync(int parentId)
    {
        var studentIds = await _context.StudentParents
            .Where(sp => sp.ParentUserId == parentId)
            .Select(sp => sp.StudentId)
            .ToListAsync();

        var students = await _context.Students
            .Include(s => s.Class)
            .Where(s => studentIds.Contains(s.Id))
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<StudentDto>>(students);
    }

    public async Task<StudentDto> CreateAsync(CreateStudentRequest request)
    {
        var student = _mapper.Map<Student>(request);
        var created = await _studentRepository.AddAsync(student);
        
        await _context.Entry(created).Reference(s => s.Class).LoadAsync();

        return _mapper.Map<StudentDto>(created);
    }

    public async Task<StudentDto> UpdateAsync(int id, CreateStudentRequest request)
    {
        var student = await _studentRepository.GetByIdAsync(id);
        if (student == null)
            throw new KeyNotFoundException($"Student with id {id} not found");

        _mapper.Map(request, student);
        await _studentRepository.UpdateAsync(student);

        await _context.Entry(student).Reference(s => s.Class).LoadAsync();

        return _mapper.Map<StudentDto>(student);
    }

    public async Task DeleteAsync(int id)
    {
        var student = await _studentRepository.GetByIdAsync(id);
        if (student == null)
            throw new KeyNotFoundException($"Student with id {id} not found");

        await _studentRepository.DeleteAsync(student);
    }
}
