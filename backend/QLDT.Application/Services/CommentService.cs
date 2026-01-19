using AutoMapper;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Comment;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;

namespace QLDT.Application.Services;

public class CommentService : ICommentService
{
    private readonly IRepository<DailyComment> _commentRepository;
    private readonly IQLDTDbContext _context;
    private readonly IMapper _mapper;

    public CommentService(
        IRepository<DailyComment> commentRepository,
        IQLDTDbContext context,
        IMapper mapper)
    {
        _commentRepository = commentRepository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<DailyCommentDto?> GetByIdAsync(int id)
    {
        var comment = await _context.DailyComments
            .Include(c => c.Student)
            .FirstOrDefaultAsync(c => c.Id == id);
        
        if (comment == null) return null;
        return _mapper.Map<DailyCommentDto>(comment);
    }

    public async Task<IEnumerable<DailyCommentDto>> GetByLessonIdAsync(int lessonId)
    {
        var comments = await _context.DailyComments
            .Include(c => c.Student)
            .Include(c => c.Lesson)
            .Where(c => c.LessonId == lessonId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<DailyCommentDto>>(comments);
    }

    public async Task<IEnumerable<DailyCommentDto>> GetByStudentIdAsync(int studentId)
    {
        var comments = await _context.DailyComments
            .Include(c => c.Student)
            .Include(c => c.Lesson)
            .Where(c => c.StudentId == studentId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<DailyCommentDto>>(comments);
    }

    public async Task<DailyCommentDto> CreateAsync(CreateDailyCommentRequest request)
    {
        var comment = _mapper.Map<DailyComment>(request);
        var created = await _commentRepository.AddAsync(comment);
        
        await _context.Entry(created).Reference(c => c.Student).LoadAsync();

        return _mapper.Map<DailyCommentDto>(created);
    }

    public async Task<DailyCommentDto> UpdateAsync(int id, CreateDailyCommentRequest request)
    {
        var comment = await _commentRepository.GetByIdAsync(id);
        if (comment == null)
            throw new KeyNotFoundException($"Comment with id {id} not found");

        _mapper.Map(request, comment);
        await _commentRepository.UpdateAsync(comment);

        await _context.Entry(comment).Reference(c => c.Student).LoadAsync();

        return _mapper.Map<DailyCommentDto>(comment);
    }

    public async Task DeleteAsync(int id)
    {
        var comment = await _commentRepository.GetByIdAsync(id);
        if (comment == null)
            throw new KeyNotFoundException($"Comment with id {id} not found");

        await _commentRepository.DeleteAsync(comment);
    }
}
