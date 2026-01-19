namespace QLDT.Domain.Entities;

public class Lesson
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public int TeacherId { get; set; }
    public DateTime Date { get; set; }
    public int LessonNumber { get; set; }
    public string? Vocabulary { get; set; } // JSON string
    public string? Homework { get; set; } // JSON string
    public string? Grammar { get; set; } // JSON string
    public string? GeneralComment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Class Class { get; set; } = null!;
    public Teacher Teacher { get; set; } = null!;
    public ICollection<DailyComment> DailyComments { get; set; } = new List<DailyComment>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
