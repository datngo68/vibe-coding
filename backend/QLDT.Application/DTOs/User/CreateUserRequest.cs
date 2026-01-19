namespace QLDT.Application.DTOs.User;

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public int? BranchId { get; set; }
    public int? TeacherId { get; set; }
    public List<int>? ClassIds { get; set; } // For Teacher role: classes to assign
    public bool IsActive { get; set; } = true;
}
