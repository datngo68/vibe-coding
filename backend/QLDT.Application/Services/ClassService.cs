using AutoMapper;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Class;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;

namespace QLDT.Application.Services;

public class ClassService : IClassService
{
    private readonly IRepository<Class> _classRepository;
    private readonly IQLDTDbContext _context;
    private readonly IMapper _mapper;

    public ClassService(
        IRepository<Class> classRepository,
        IQLDTDbContext context,
        IMapper mapper)
    {
        _classRepository = classRepository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ClassDto>> GetAllAsync()
    {
        var classes = await _context.Classes
            .Include(c => c.Branch)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ClassDto>>(classes);
    }

    public async Task<IEnumerable<ClassDto>> GetByTeacherIdAsync(int teacherId)
    {
        var classes = await _context.ClassTeachers
            .Where(ct => ct.TeacherId == teacherId)
            .Include(ct => ct.Class)
                .ThenInclude(c => c.Branch)
            .Select(ct => ct.Class)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ClassDto>>(classes);
    }

    public async Task<ClassDto?> GetByIdAsync(int id)
    {
        var classEntity = await _context.Classes
            .Include(c => c.Branch)
            .Include(c => c.ClassTeachers)
                .ThenInclude(ct => ct.Teacher)
            .FirstOrDefaultAsync(c => c.Id == id);
        
        if (classEntity == null) return null;
        return _mapper.Map<ClassDto>(classEntity);
    }

    public async Task<IEnumerable<ClassDto>> GetByBranchIdAsync(int branchId)
    {
        var classes = await _context.Classes
            .Include(c => c.Branch)
            .Where(c => c.BranchId == branchId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ClassDto>>(classes);
    }

    public async Task<ClassDto> CreateAsync(CreateClassRequest request)
    {
        var classEntity = _mapper.Map<Class>(request);
        var created = await _classRepository.AddAsync(classEntity);
        
        // Assign teachers if provided
        if (request.TeacherIds != null && request.TeacherIds.Count > 0)
        {
            foreach (var teacherId in request.TeacherIds)
            {
                var classTeacher = new ClassTeacher
                {
                    ClassId = created.Id,
                    TeacherId = teacherId
                };
                _context.ClassTeachers.Add(classTeacher);
            }
            await _context.SaveChangesAsync();
        }
        
        await _context.Entry(created).Reference(c => c.Branch).LoadAsync();
        await _context.Entry(created).Collection(c => c.ClassTeachers)
            .Query()
            .Include(ct => ct.Teacher)
            .LoadAsync();

        return _mapper.Map<ClassDto>(created);
    }

    public async Task<ClassDto> UpdateAsync(int id, CreateClassRequest request)
    {
        var classEntity = await _classRepository.GetByIdAsync(id);
        if (classEntity == null)
            throw new KeyNotFoundException($"Class with id {id} not found");

        _mapper.Map(request, classEntity);
        await _classRepository.UpdateAsync(classEntity);

        await _context.Entry(classEntity).Reference(c => c.Branch).LoadAsync();

        return _mapper.Map<ClassDto>(classEntity);
    }

    public async Task DeleteAsync(int id)
    {
        var classEntity = await _classRepository.GetByIdAsync(id);
        if (classEntity == null)
            throw new KeyNotFoundException($"Class with id {id} not found");

        await _classRepository.DeleteAsync(classEntity);
    }

    public async Task AssignTeacherAsync(int classId, int teacherId)
    {
        // Check if class exists
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity == null)
            throw new KeyNotFoundException($"Class with id {classId} not found");

        // Check if teacher exists
        var teacher = await _context.Teachers.FindAsync(teacherId);
        if (teacher == null)
            throw new KeyNotFoundException($"Teacher with id {teacherId} not found");

        // Check if already assigned
        var existing = await _context.ClassTeachers
            .FirstOrDefaultAsync(ct => ct.ClassId == classId && ct.TeacherId == teacherId);
        
        if (existing != null)
            return; // Already assigned

        var classTeacher = new ClassTeacher
        {
            ClassId = classId,
            TeacherId = teacherId
        };

        _context.ClassTeachers.Add(classTeacher);
        await _context.SaveChangesAsync();
    }

    public async Task UnassignTeacherAsync(int classId, int teacherId)
    {
        var classTeacher = await _context.ClassTeachers
            .FirstOrDefaultAsync(ct => ct.ClassId == classId && ct.TeacherId == teacherId);

        if (classTeacher == null)
            throw new KeyNotFoundException($"Teacher {teacherId} is not assigned to class {classId}");

        _context.ClassTeachers.Remove(classTeacher);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateIsCompletedAsync(int classId, bool isCompleted)
    {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity == null)
            throw new KeyNotFoundException($"Class with id {classId} not found");

        classEntity.IsCompleted = isCompleted;
        await _classRepository.UpdateAsync(classEntity);
    }
}
