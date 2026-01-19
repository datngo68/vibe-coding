using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLDT.Application.DTOs.SharedLink;
using QLDT.Application.Services;
using System.Security.Claims;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SharedLinksController : ControllerBase
{
    private readonly ISharedLinkService _sharedLinkService;

    public SharedLinksController(ISharedLinkService sharedLinkService)
    {
        _sharedLinkService = sharedLinkService;
    }

    /// <summary>
    /// Lấy tất cả link chia sẻ của user hiện tại
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SharedLinkDto>>> GetAll()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var sharedLinks = await _sharedLinkService.GetAllByUserIdAsync(userId);
        return Ok(sharedLinks);
    }

    /// <summary>
    /// Tạo link chia sẻ mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SharedLinkDto>> Create([FromBody] CreateSharedLinkRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var sharedLink = await _sharedLinkService.CreateAsync(request, userId);
        return Ok(sharedLink);
    }

    /// <summary>
    /// Lấy thông tin link chia sẻ theo token (public, không cần auth)
    /// </summary>
    [HttpGet("{token}")]
    [AllowAnonymous]
    public async Task<ActionResult<SharedLinkDto>> GetByToken(string token)
    {
        var sharedLink = await _sharedLinkService.GetByTokenAsync(token);
        if (sharedLink == null)
            return NotFound();

        return Ok(sharedLink);
    }

    /// <summary>
    /// Xóa link chia sẻ
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _sharedLinkService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
