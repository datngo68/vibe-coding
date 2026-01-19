namespace QLDT.Domain.Entities;

public class DailyComment
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public int StudentId { get; set; }
    public decimal? VocabularyScore { get; set; }
    public decimal? SchoolExamScore { get; set; }
    public string? HomeworkStatus { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Lesson Lesson { get; set; } = null!;
    public Student Student { get; set; } = null!;
}
