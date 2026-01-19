namespace QLDT.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
    public int? BranchId { get; set; }
    public int? TeacherId { get; set; } // Link to Teacher entity when Role is Teacher
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Branch? Branch { get; set; }
    public Teacher? Teacher { get; set; }
    public ICollection<SharedLink> SharedLinks { get; set; } = new List<SharedLink>();
}

public enum UserRole
{
    Owner = 1,
    BranchManager = 2,
    Teacher = 3,
    Parent = 4
}
