namespace QLDT.Domain.Entities;

public class ExamResult
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public int StudentId { get; set; }
    public decimal? SpeakingScore { get; set; }
    public decimal? ListeningScore { get; set; }
    public decimal? ReadingWritingScore { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Exam Exam { get; set; } = null!;
    public Student Student { get; set; } = null!;
}
