using AutoMapper;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Attendance;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;

namespace QLDT.Application.Services;

public class AttendanceService : IAttendanceService
{
    private readonly IRepository<Attendance> _attendanceRepository;
    private readonly IQLDTDbContext _context;
    private readonly IMapper _mapper;

    public AttendanceService(
        IRepository<Attendance> attendanceRepository,
        IQLDTDbContext context,
        IMapper mapper)
    {
        _attendanceRepository = attendanceRepository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<AttendanceDto?> GetByIdAsync(int id)
    {
        var attendance = await _context.Attendances
            .Include(a => a.Student)
            .FirstOrDefaultAsync(a => a.Id == id);
        
        if (attendance == null) return null;
        return _mapper.Map<AttendanceDto>(attendance);
    }

    public async Task<IEnumerable<AttendanceDto>> GetByLessonIdAsync(int lessonId)
    {
        var attendances = await _context.Attendances
            .Include(a => a.Student)
            .Include(a => a.Lesson)
            .Where(a => a.LessonId == lessonId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<AttendanceDto>>(attendances);
    }

    public async Task<IEnumerable<AttendanceDto>> GetByStudentIdAsync(int studentId)
    {
        var attendances = await _context.Attendances
            .Include(a => a.Student)
            .Include(a => a.Lesson)
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<AttendanceDto>>(attendances);
    }

    public async Task<AttendanceDto> CreateAsync(CreateAttendanceRequest request)
    {
        var attendance = _mapper.Map<Attendance>(request);
        var created = await _attendanceRepository.AddAsync(attendance);
        
        await _context.Entry(created).Reference(a => a.Student).LoadAsync();

        return _mapper.Map<AttendanceDto>(created);
    }

    public async Task<AttendanceDto> UpdateAsync(int id, CreateAttendanceRequest request)
    {
        var attendance = await _attendanceRepository.GetByIdAsync(id);
        if (attendance == null)
            throw new KeyNotFoundException($"Attendance with id {id} not found");

        _mapper.Map(request, attendance);
        await _attendanceRepository.UpdateAsync(attendance);

        await _context.Entry(attendance).Reference(a => a.Student).LoadAsync();

        return _mapper.Map<AttendanceDto>(attendance);
    }

    public async Task DeleteAsync(int id)
    {
        var attendance = await _attendanceRepository.GetByIdAsync(id);
        if (attendance == null)
            throw new KeyNotFoundException($"Attendance with id {id} not found");

        await _attendanceRepository.DeleteAsync(attendance);
    }
}
