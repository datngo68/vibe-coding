namespace QLDT.Application.DTOs.User;

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public int? BranchId { get; set; }
    public int? TeacherId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}
