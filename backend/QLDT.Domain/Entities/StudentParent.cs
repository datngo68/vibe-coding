namespace QLDT.Domain.Entities;

public class StudentParent
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int ParentUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Student Student { get; set; } = null!;
    public User ParentUser { get; set; } = null!;
}
