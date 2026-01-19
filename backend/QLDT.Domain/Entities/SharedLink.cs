namespace QLDT.Domain.Entities;

public class SharedLink
{
    public int Id { get; set; }
    public SharedLinkEntityType EntityType { get; set; }
    public int EntityId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
}

public enum SharedLinkEntityType
{
    Lesson = 1,
    Exam = 2
}
