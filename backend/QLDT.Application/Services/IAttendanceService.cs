using QLDT.Application.DTOs.Attendance;

namespace QLDT.Application.Services;

public interface IAttendanceService
{
    Task<AttendanceDto?> GetByIdAsync(int id);
    Task<IEnumerable<AttendanceDto>> GetByLessonIdAsync(int lessonId);
    Task<IEnumerable<AttendanceDto>> GetByStudentIdAsync(int studentId);
    Task<AttendanceDto> CreateAsync(CreateAttendanceRequest request);
    Task<AttendanceDto> UpdateAsync(int id, CreateAttendanceRequest request);
    Task DeleteAsync(int id);
}
