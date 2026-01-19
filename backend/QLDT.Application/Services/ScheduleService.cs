using AutoMapper;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Schedule;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;

namespace QLDT.Application.Services;

public class ScheduleService : IScheduleService
{
    private readonly IRepository<Schedule> _scheduleRepository;
    private readonly IQLDTDbContext _context;
    private readonly IMapper _mapper;

    public ScheduleService(
        IRepository<Schedule> scheduleRepository,
        IQLDTDbContext context,
        IMapper mapper)
    {
        _scheduleRepository = scheduleRepository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<ScheduleDto?> GetByIdAsync(int id)
    {
        var schedule = await _context.Schedules
            .Include(s => s.Class)
            .FirstOrDefaultAsync(s => s.Id == id);
        
        if (schedule == null) return null;
        return _mapper.Map<ScheduleDto>(schedule);
    }

    public async Task<IEnumerable<ScheduleDto>> GetAllAsync()
    {
        var schedules = await _context.Schedules
            .Include(s => s.Class)
            .OrderByDescending(s => s.Id)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ScheduleDto>>(schedules);
    }

    public async Task<IEnumerable<ScheduleDto>> GetByClassIdAsync(int classId)
    {
        var schedules = await _context.Schedules
            .Include(s => s.Class)
            .Where(s => s.ClassId == classId)
            .OrderByDescending(s => s.Id)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ScheduleDto>>(schedules);
    }

    public async Task<ScheduleDto> CreateAsync(CreateScheduleRequest request)
    {
        var schedule = _mapper.Map<Schedule>(request);
        var created = await _scheduleRepository.AddAsync(schedule);
        
        await _context.Entry(created).Reference(s => s.Class).LoadAsync();

        return _mapper.Map<ScheduleDto>(created);
    }

    public async Task<ScheduleDto> UpdateAsync(int id, CreateScheduleRequest request)
    {
        var schedule = await _scheduleRepository.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"Schedule with id {id} not found");

        _mapper.Map(request, schedule);
        await _scheduleRepository.UpdateAsync(schedule);

        await _context.Entry(schedule).Reference(s => s.Class).LoadAsync();

        return _mapper.Map<ScheduleDto>(schedule);
    }

    public async Task DeleteAsync(int id)
    {
        var schedule = await _scheduleRepository.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"Schedule with id {id} not found");

        await _scheduleRepository.DeleteAsync(schedule);
    }
}
