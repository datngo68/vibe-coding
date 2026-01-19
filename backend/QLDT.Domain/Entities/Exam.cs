namespace QLDT.Domain.Entities;

public class Exam
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public int TeacherId { get; set; }
    public DateTime Date { get; set; }
    public string ExamType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Class Class { get; set; } = null!;
    public Teacher Teacher { get; set; } = null!;
    public ICollection<ExamResult> ExamResults { get; set; } = new List<ExamResult>();
}
