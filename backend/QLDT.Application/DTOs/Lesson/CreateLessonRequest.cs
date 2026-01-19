using QLDT.Domain.ValueObjects;

namespace QLDT.Application.DTOs.Lesson;

public class CreateLessonRequest
{
    public int ClassId { get; set; }
    public int TeacherId { get; set; }
    public DateTime Date { get; set; }
    public int LessonNumber { get; set; }
    public List<VocabularyItem>? Vocabulary { get; set; }
    public List<HomeworkItem>? Homework { get; set; }
    public List<GrammarItem>? Grammar { get; set; }
    public string? GeneralComment { get; set; }
}
