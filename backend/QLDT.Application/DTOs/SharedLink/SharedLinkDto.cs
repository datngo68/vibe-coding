using QLDT.Domain.Entities;

namespace QLDT.Application.DTOs.SharedLink;

public class SharedLinkDto
{
    public int Id { get; set; }
    public SharedLinkEntityType EntityType { get; set; }
    public int EntityId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string ShareUrl { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
