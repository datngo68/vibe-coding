using QLDT.Application.DTOs.Dashboard;

namespace QLDT.Application.Services;

public interface IDashboardService
{
    Task<DashboardStatisticsDto> GetStatisticsAsync(int? branchId = null);
    Task<IEnumerable<RecentActivityDto>> GetRecentActivitiesAsync(int? branchId = null, int limit = 10);
}
