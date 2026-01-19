using QLDT.Application.DTOs.Schedule;

namespace QLDT.Application.Services;

public interface IScheduleService
{
    Task<ScheduleDto?> GetByIdAsync(int id);
    Task<IEnumerable<ScheduleDto>> GetAllAsync();
    Task<IEnumerable<ScheduleDto>> GetByClassIdAsync(int classId);
    Task<ScheduleDto> CreateAsync(CreateScheduleRequest request);
    Task<ScheduleDto> UpdateAsync(int id, CreateScheduleRequest request);
    Task DeleteAsync(int id);
}
