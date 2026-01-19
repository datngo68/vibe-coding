namespace QLDT.Application.DTOs.Exam;

public class CreateExamRequest
{
    public int ClassId { get; set; }
    public int TeacherId { get; set; }
    public DateTime Date { get; set; }
    public string ExamType { get; set; } = string.Empty;
}
