using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Dashboard;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;
using QLDT.Domain.ValueObjects;

namespace QLDT.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IQLDTDbContext _context;

    public DashboardService(IQLDTDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatisticsDto> GetStatisticsAsync(int? branchId = null)
    {
        var now = DateTime.UtcNow;
        var sixMonthsAgo = now.AddMonths(-6);

        var query = _context.Classes.AsQueryable();
        if (branchId.HasValue)
        {
            query = query.Where(c => c.BranchId == branchId.Value);
        }

        var classes = await query.ToListAsync();
        var classIds = classes.Select(c => c.Id).ToList();

        var statistics = new DashboardStatisticsDto
        {
            TotalBranches = branchId.HasValue ? 1 : await _context.Branches.CountAsync(),
            TotalClasses = classes.Count,
            TotalStudents = await _context.Students
                .Where(s => branchId == null || classIds.Contains(s.ClassId))
                .CountAsync(),
            TotalTeachers = await _context.Teachers
                .Where(t => branchId == null || t.BranchId == branchId.Value)
                .CountAsync(),
            TotalLessons = await _context.Lessons
                .Where(l => branchId == null || classIds.Contains(l.ClassId))
                .CountAsync(),
            TotalExams = await _context.Exams
                .Where(e => branchId == null || classIds.Contains(e.ClassId))
                .CountAsync(),
        };

        // Calculate average attendance rate
        var attendances = await _context.Attendances
            .Include(a => a.Lesson)
            .Where(a => branchId == null || classIds.Contains(a.Lesson.ClassId))
            .ToListAsync();
        
        if (attendances.Any())
        {
            var totalAttendances = attendances.Count;
            var presentCount = attendances.Count(a => a.Status == AttendanceStatus.Present);
            statistics.AverageAttendanceRate = totalAttendances > 0 
                ? (double)presentCount / totalAttendances * 100 
                : 0;
        }

        // Calculate average exam score
        var examResults = await _context.ExamResults
            .Include(r => r.Exam)
            .Where(r => branchId == null || classIds.Contains(r.Exam.ClassId))
            .ToListAsync();
        
        if (examResults.Any())
        {
            var scores = examResults
                .Where(r => r.SpeakingScore.HasValue || r.ListeningScore.HasValue || r.ReadingWritingScore.HasValue)
                .SelectMany(r => new[] { r.SpeakingScore, r.ListeningScore, r.ReadingWritingScore })
                .Where(s => s.HasValue)
                .Select(s => (double)s!.Value)
                .ToList();
            
            statistics.AverageExamScore = scores.Any() ? scores.Average() : 0;
        }

        // Student count by month (last 6 months)
        var students = await _context.Students
            .Where(s => branchId == null || classIds.Contains(s.ClassId))
            .Where(s => s.CreatedAt >= sixMonthsAgo)
            .ToListAsync();

        var studentCountByMonth = students
            .GroupBy(s => new { Year = s.CreatedAt.Year, Month = s.CreatedAt.Month })
            .Select(g => new StudentCountByMonthDto
            {
                Month = $"{g.Key.Month:00}/{g.Key.Year}",
                Count = g.Count()
            })
            .OrderBy(x => x.Month)
            .ToList();

        statistics.StudentCountByMonth = studentCountByMonth;

        // Attendance rate by month (last 6 months)
        var attendancesByMonth = attendances
            .Where(a => a.CreatedAt >= sixMonthsAgo)
            .GroupBy(a => new { Year = a.CreatedAt.Year, Month = a.CreatedAt.Month })
            .Select(g => new
            {
                Month = $"{g.Key.Month:00}/{g.Key.Year}",
                Total = g.Count(),
                Present = g.Count(a => a.Status == AttendanceStatus.Present)
            })
            .ToList();

        statistics.AttendanceRateByMonth = attendancesByMonth
            .Select(a => new AttendanceRateByMonthDto
            {
                Month = a.Month,
                Rate = a.Total > 0 ? (double)a.Present / a.Total * 100 : 0
            })
            .OrderBy(x => x.Month)
            .ToList();

        // Average score by month (last 6 months)
        var examResultsByMonth = examResults
            .Where(r => r.CreatedAt >= sixMonthsAgo)
            .GroupBy(r => new { Year = r.CreatedAt.Year, Month = r.CreatedAt.Month })
            .Select(g => new
            {
                Month = $"{g.Key.Month:00}/{g.Key.Year}",
                Scores = g
                    .SelectMany(r => new[] { r.SpeakingScore, r.ListeningScore, r.ReadingWritingScore })
                    .Where(s => s.HasValue)
                    .Select(s => (double)s!.Value)
                    .ToList()
            })
            .ToList();

        statistics.AverageScoreByMonth = examResultsByMonth
            .Select(e => new AverageScoreByMonthDto
            {
                Month = e.Month,
                AverageScore = e.Scores.Any() ? e.Scores.Average() : 0
            })
            .OrderBy(x => x.Month)
            .ToList();

        return statistics;
    }

    public async Task<IEnumerable<RecentActivityDto>> GetRecentActivitiesAsync(int? branchId = null, int limit = 10)
    {
        var activities = new List<RecentActivityDto>();

        var query = _context.Classes.AsQueryable();
        if (branchId.HasValue)
        {
            query = query.Where(c => c.BranchId == branchId.Value);
        }
        var classes = await query.ToListAsync();
        var classIds = classes.Select(c => c.Id).ToList();

        // Recent lessons
        var recentLessons = await _context.Lessons
            .Where(l => branchId == null || classIds.Contains(l.ClassId))
            .Include(l => l.Class)
            .Include(l => l.Teacher)
            .OrderByDescending(l => l.CreatedAt)
            .Take(limit)
            .ToListAsync();

        activities.AddRange(recentLessons.Select(l => new RecentActivityDto
        {
            Type = "Lesson",
            Description = $"Buổi học {l.LessonNumber} - {l.Class.Name}",
            CreatedAt = l.CreatedAt,
            EntityId = l.Id,
            EntityName = l.Class.Name
        }));

        // Recent exams
        var recentExams = await _context.Exams
            .Where(e => branchId == null || classIds.Contains(e.ClassId))
            .Include(e => e.Class)
            .Include(e => e.Teacher)
            .OrderByDescending(e => e.CreatedAt)
            .Take(limit)
            .ToListAsync();

        activities.AddRange(recentExams.Select(e => new RecentActivityDto
        {
            Type = "Exam",
            Description = $"{e.ExamType} - {e.Class.Name}",
            CreatedAt = e.CreatedAt,
            EntityId = e.Id,
            EntityName = e.Class.Name
        }));

        // Recent comments
        var recentComments = await _context.DailyComments
            .Where(c => branchId == null || classIds.Contains(c.Lesson.ClassId))
            .Include(c => c.Lesson)
                .ThenInclude(l => l.Class)
            .Include(c => c.Student)
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .ToListAsync();

        activities.AddRange(recentComments.Select(c => new RecentActivityDto
        {
            Type = "Comment",
            Description = $"Nhận xét cho {c.Student.Name} - {c.Lesson.Class.Name}",
            CreatedAt = c.CreatedAt,
            EntityId = c.Id,
            EntityName = c.Student.Name
        }));

        // Recent classes
        var recentClasses = await _context.Classes
            .Where(c => branchId == null || c.BranchId == branchId.Value)
            .Include(c => c.Branch)
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .ToListAsync();

        activities.AddRange(recentClasses.Select(c => new RecentActivityDto
        {
            Type = "Class",
            Description = $"Lớp học mới: {c.Name} - {c.Branch.Name}",
            CreatedAt = c.CreatedAt,
            EntityId = c.Id,
            EntityName = c.Name
        }));

        // Recent students
        var recentStudents = await _context.Students
            .Where(s => branchId == null || classIds.Contains(s.ClassId))
            .Include(s => s.Class)
            .OrderByDescending(s => s.CreatedAt)
            .Take(limit)
            .ToListAsync();

        activities.AddRange(recentStudents.Select(s => new RecentActivityDto
        {
            Type = "Student",
            Description = $"Học sinh mới: {s.Name} - {s.Class.Name}",
            CreatedAt = s.CreatedAt,
            EntityId = s.Id,
            EntityName = s.Name
        }));

        return activities
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit);
    }
}
