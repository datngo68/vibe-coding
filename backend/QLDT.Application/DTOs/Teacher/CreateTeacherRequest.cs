namespace QLDT.Application.DTOs.Teacher;

public class CreateTeacherRequest
{
    public int BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
}
