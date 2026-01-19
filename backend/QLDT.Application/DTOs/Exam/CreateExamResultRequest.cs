namespace QLDT.Application.DTOs.Exam;

public class CreateExamResultRequest
{
    public int ExamId { get; set; }
    public int StudentId { get; set; }
    public decimal? SpeakingScore { get; set; }
    public decimal? ListeningScore { get; set; }
    public decimal? ReadingWritingScore { get; set; }
    public string? Comment { get; set; }
}
