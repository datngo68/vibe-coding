namespace QLDT.Application.DTOs.Comment;

public class CreateDailyCommentRequest
{
    public int LessonId { get; set; }
    public int StudentId { get; set; }
    public decimal? VocabularyScore { get; set; }
    public decimal? SchoolExamScore { get; set; }
    public string? HomeworkStatus { get; set; }
    public string? Comment { get; set; }
}
