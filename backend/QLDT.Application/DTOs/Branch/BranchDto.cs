namespace QLDT.Application.DTOs.Branch;

public class BranchDto
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; }
}
