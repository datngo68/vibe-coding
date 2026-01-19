namespace QLDT.Application.DTOs.Comment;

public class DailyCommentDto
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public string? LessonDate { get; set; }
    public string? ClassName { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public decimal? VocabularyScore { get; set; }
    public decimal? SchoolExamScore { get; set; }
    public string? HomeworkStatus { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
