using QLDT.Domain.Entities;

namespace QLDT.Application.DTOs.Attendance;

public class AttendanceDto
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public string? LessonDate { get; set; }
    public string? ClassName { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public AttendanceStatus Status { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}
