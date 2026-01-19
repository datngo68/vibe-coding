namespace QLDT.Domain.Entities;

public class Attendance
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public int StudentId { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Lesson Lesson { get; set; } = null!;
    public Student Student { get; set; } = null!;
}

public enum AttendanceStatus
{
    Present = 1,
    Absent = 2,
    Late = 3
}
