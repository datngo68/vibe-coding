namespace QLDT.Domain.Entities;

public class Student
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? ParentName { get; set; }
    public string? ParentPhone { get; set; }
    public string? ParentEmail { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Class Class { get; set; } = null!;
    public ICollection<DailyComment> DailyComments { get; set; } = new List<DailyComment>();
    public ICollection<ExamResult> ExamResults { get; set; } = new List<ExamResult>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
