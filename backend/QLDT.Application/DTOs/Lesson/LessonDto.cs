using QLDT.Domain.ValueObjects;

namespace QLDT.Application.DTOs.Lesson;

public class LessonDto
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public int TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int LessonNumber { get; set; }
    public List<VocabularyItem>? Vocabulary { get; set; }
    public List<HomeworkItem>? Homework { get; set; }
    public List<GrammarItem>? Grammar { get; set; }
    public string? GeneralComment { get; set; }
    public DateTime CreatedAt { get; set; }
}
