namespace QLDT.Domain.Entities;

public class Branch
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Owner Owner { get; set; } = null!;
    public ICollection<Class> Classes { get; set; } = new List<Class>();
    public ICollection<Teacher> Teachers { get; set; } = new List<Teacher>();
}
