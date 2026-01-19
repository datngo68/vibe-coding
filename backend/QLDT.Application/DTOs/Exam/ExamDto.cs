namespace QLDT.Application.DTOs.Exam;

public class ExamDto
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public int TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string ExamType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
