namespace QLDT.Application.DTOs.Teacher;

public class CreateTeacherWithAccountRequest
{
    public int BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    
    // User account information
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
