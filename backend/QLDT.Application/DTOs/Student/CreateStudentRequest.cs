namespace QLDT.Application.DTOs.Student;

public class CreateStudentRequest
{
    public int ClassId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? ParentName { get; set; }
    public string? ParentPhone { get; set; }
    public string? ParentEmail { get; set; }
}
