namespace QLDT.Application.DTOs.Class;

public class ClassDto
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Level { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ClassTeacherDto> Teachers { get; set; } = new List<ClassTeacherDto>();
}

public class ClassTeacherDto
{
    public int TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string TeacherEmail { get; set; } = string.Empty;
}
