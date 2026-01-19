using AutoMapper;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Exam;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;

namespace QLDT.Application.Services;

public class ExamService : IExamService
{
    private readonly IRepository<Exam> _examRepository;
    private readonly IRepository<ExamResult> _examResultRepository;
    private readonly IQLDTDbContext _context;
    private readonly IMapper _mapper;

    public ExamService(
        IRepository<Exam> examRepository,
        IRepository<ExamResult> examResultRepository,
        IQLDTDbContext context,
        IMapper mapper)
    {
        _examRepository = examRepository;
        _examResultRepository = examResultRepository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ExamDto>> GetAllAsync()
    {
        var exams = await _context.Exams
            .Include(e => e.Class)
            .Include(e => e.Teacher)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ExamDto>>(exams);
    }

    public async Task<ExamDto?> GetByIdAsync(int id)
    {
        var exam = await _context.Exams
            .Include(e => e.Class)
            .Include(e => e.Teacher)
            .FirstOrDefaultAsync(e => e.Id == id);
        
        if (exam == null) return null;
        return _mapper.Map<ExamDto>(exam);
    }

    public async Task<IEnumerable<ExamDto>> GetByClassIdAsync(int classId)
    {
        var exams = await _context.Exams
            .Include(e => e.Class)
            .Include(e => e.Teacher)
            .Where(e => e.ClassId == classId)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ExamDto>>(exams);
    }

    public async Task<ExamDto> CreateAsync(CreateExamRequest request)
    {
        var exam = _mapper.Map<Exam>(request);
        var created = await _examRepository.AddAsync(exam);
        
        await _context.Entry(created).Reference(e => e.Class).LoadAsync();
        await _context.Entry(created).Reference(e => e.Teacher).LoadAsync();

        return _mapper.Map<ExamDto>(created);
    }

    public async Task<ExamDto> UpdateAsync(int id, CreateExamRequest request)
    {
        var exam = await _examRepository.GetByIdAsync(id);
        if (exam == null)
            throw new KeyNotFoundException($"Exam with id {id} not found");

        _mapper.Map(request, exam);
        await _examRepository.UpdateAsync(exam);

        await _context.Entry(exam).Reference(e => e.Class).LoadAsync();
        await _context.Entry(exam).Reference(e => e.Teacher).LoadAsync();

        return _mapper.Map<ExamDto>(exam);
    }

    public async Task DeleteAsync(int id)
    {
        var exam = await _examRepository.GetByIdAsync(id);
        if (exam == null)
            throw new KeyNotFoundException($"Exam with id {id} not found");

        await _examRepository.DeleteAsync(exam);
    }

    public async Task<ExamResultDto?> GetResultByIdAsync(int id)
    {
        var result = await _context.ExamResults
            .Include(r => r.Student)
            .FirstOrDefaultAsync(r => r.Id == id);
        
        if (result == null) return null;
        return _mapper.Map<ExamResultDto>(result);
    }

    public async Task<IEnumerable<ExamResultDto>> GetResultsByExamIdAsync(int examId)
    {
        var results = await _context.ExamResults
            .Include(r => r.Student)
            .Include(r => r.Exam)
            .Where(r => r.ExamId == examId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ExamResultDto>>(results);
    }

    public async Task<IEnumerable<ExamResultDto>> GetResultsByStudentIdAsync(int studentId)
    {
        var results = await _context.ExamResults
            .Include(r => r.Student)
            .Include(r => r.Exam)
            .Where(r => r.StudentId == studentId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ExamResultDto>>(results);
    }

    public async Task<ExamResultDto> CreateResultAsync(CreateExamResultRequest request)
    {
        var result = _mapper.Map<ExamResult>(request);
        var created = await _examResultRepository.AddAsync(result);
        
        await _context.Entry(created).Reference(r => r.Student).LoadAsync();

        return _mapper.Map<ExamResultDto>(created);
    }

    public async Task<ExamResultDto> UpdateResultAsync(int id, CreateExamResultRequest request)
    {
        var result = await _examResultRepository.GetByIdAsync(id);
        if (result == null)
            throw new KeyNotFoundException($"ExamResult with id {id} not found");

        _mapper.Map(request, result);
        await _examResultRepository.UpdateAsync(result);

        await _context.Entry(result).Reference(r => r.Student).LoadAsync();

        return _mapper.Map<ExamResultDto>(result);
    }

    public async Task DeleteResultAsync(int id)
    {
        var result = await _examResultRepository.GetByIdAsync(id);
        if (result == null)
            throw new KeyNotFoundException($"ExamResult with id {id} not found");

        await _examResultRepository.DeleteAsync(result);
    }
}
