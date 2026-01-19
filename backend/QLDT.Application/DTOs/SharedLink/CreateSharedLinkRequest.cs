using QLDT.Domain.Entities;

namespace QLDT.Application.DTOs.SharedLink;

public class CreateSharedLinkRequest
{
    public SharedLinkEntityType EntityType { get; set; }
    public int EntityId { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
