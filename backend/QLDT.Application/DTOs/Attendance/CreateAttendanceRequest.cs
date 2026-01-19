using QLDT.Domain.Entities;

namespace QLDT.Application.DTOs.Attendance;

public class CreateAttendanceRequest
{
    public int LessonId { get; set; }
    public int StudentId { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Note { get; set; }
}
