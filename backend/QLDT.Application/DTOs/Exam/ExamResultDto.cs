namespace QLDT.Application.DTOs.Exam;

public class ExamResultDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string? ExamType { get; set; }
    public string? ExamDate { get; set; }
    public string? ClassName { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public decimal? SpeakingScore { get; set; }
    public decimal? ListeningScore { get; set; }
    public decimal? ReadingWritingScore { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
