namespace QLDT.Application.DTOs.Student;

public class StudentDto
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? ParentName { get; set; }
    public string? ParentPhone { get; set; }
    public string? ParentEmail { get; set; }
    public DateTime CreatedAt { get; set; }
    public ParentUserDto? ParentUser { get; set; }
}

public class ParentUserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Phone { get; set; }
}
