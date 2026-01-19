using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.Services;
using QLDT.Infrastructure.Data;
using System.Security.Claims;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>
    /// Lấy thống kê tổng quan cho dashboard
    /// </summary>
    [HttpGet("statistics")]
    public async Task<ActionResult> GetStatistics([FromQuery] int? branchId = null)
    {
        // If user is BranchManager or Teacher, filter by their branch
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
        var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        
        int? userBranchId = null;
        if (roleClaim?.Value == "BranchManager" || roleClaim?.Value == "Teacher")
        {
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                using var scope = HttpContext.RequestServices.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<QLDT.Infrastructure.Data.QLDTDbContext>();
                var user = await dbContext.Users.FindAsync(userId);
                if (user?.BranchId.HasValue == true)
                {
                    userBranchId = user.BranchId.Value;
                }
            }
        }

        var finalBranchId = branchId ?? userBranchId;
        var statistics = await _dashboardService.GetStatisticsAsync(finalBranchId);
        return Ok(statistics);
    }

    /// <summary>
    /// Lấy danh sách hoạt động gần đây
    /// </summary>
    [HttpGet("recent-activities")]
    public async Task<ActionResult> GetRecentActivities([FromQuery] int? branchId = null, [FromQuery] int limit = 10)
    {
        // If user is BranchManager or Teacher, filter by their branch
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
        var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        
        int? userBranchId = null;
        if (roleClaim?.Value == "BranchManager" || roleClaim?.Value == "Teacher")
        {
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                using var scope = HttpContext.RequestServices.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<QLDT.Infrastructure.Data.QLDTDbContext>();
                var user = await dbContext.Users.FindAsync(userId);
                if (user?.BranchId.HasValue == true)
                {
                    userBranchId = user.BranchId.Value;
                }
            }
        }

        var finalBranchId = branchId ?? userBranchId;
        var activities = await _dashboardService.GetRecentActivitiesAsync(finalBranchId, limit);
        return Ok(activities);
    }
}
