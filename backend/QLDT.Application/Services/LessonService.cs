using AutoMapper;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Lesson;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;

namespace QLDT.Application.Services;

public class LessonService : ILessonService
{
    private readonly IRepository<Lesson> _lessonRepository;
    private readonly IQLDTDbContext _context;
    private readonly IMapper _mapper;

    public LessonService(
        IRepository<Lesson> lessonRepository,
        IQLDTDbContext context,
        IMapper mapper)
    {
        _lessonRepository = lessonRepository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<LessonDto>> GetAllAsync()
    {
        var lessons = await _context.Lessons
            .Include(l => l.Class)
            .Include(l => l.Teacher)
            .OrderByDescending(l => l.Date)
            .ThenByDescending(l => l.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<LessonDto>>(lessons);
    }

    public async Task<LessonDto?> GetByIdAsync(int id)
    {
        var lesson = await _context.Lessons
            .Include(l => l.Class)
            .Include(l => l.Teacher)
            .FirstOrDefaultAsync(l => l.Id == id);
        
        if (lesson == null) return null;
        return _mapper.Map<LessonDto>(lesson);
    }

    public async Task<IEnumerable<LessonDto>> GetByClassIdAsync(int classId)
    {
        var lessons = await _context.Lessons
            .Include(l => l.Class)
            .Include(l => l.Teacher)
            .Where(l => l.ClassId == classId)
            .OrderByDescending(l => l.Date)
            .ThenByDescending(l => l.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<LessonDto>>(lessons);
    }

    public async Task<LessonDto> CreateAsync(CreateLessonRequest request)
    {
        var lesson = _mapper.Map<Lesson>(request);
        var created = await _lessonRepository.AddAsync(lesson);
        
        await _context.Entry(created).Reference(l => l.Class).LoadAsync();
        await _context.Entry(created).Reference(l => l.Teacher).LoadAsync();

        return _mapper.Map<LessonDto>(created);
    }

    public async Task<LessonDto> UpdateAsync(int id, CreateLessonRequest request)
    {
        var lesson = await _lessonRepository.GetByIdAsync(id);
        if (lesson == null)
            throw new KeyNotFoundException($"Lesson with id {id} not found");

        _mapper.Map(request, lesson);
        await _lessonRepository.UpdateAsync(lesson);

        await _context.Entry(lesson).Reference(l => l.Class).LoadAsync();
        await _context.Entry(lesson).Reference(l => l.Teacher).LoadAsync();

        return _mapper.Map<LessonDto>(lesson);
    }

    public async Task DeleteAsync(int id)
    {
        var lesson = await _lessonRepository.GetByIdAsync(id);
        if (lesson == null)
            throw new KeyNotFoundException($"Lesson with id {id} not found");

        await _lessonRepository.DeleteAsync(lesson);
    }
}
