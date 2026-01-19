namespace QLDT.Application.DTOs.Dashboard;

public class DashboardStatisticsDto
{
    public int TotalBranches { get; set; }
    public int TotalClasses { get; set; }
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalLessons { get; set; }
    public int TotalExams { get; set; }
    public double AverageAttendanceRate { get; set; }
    public double AverageExamScore { get; set; }
    public List<StudentCountByMonthDto> StudentCountByMonth { get; set; } = new();
    public List<AttendanceRateByMonthDto> AttendanceRateByMonth { get; set; } = new();
    public List<AverageScoreByMonthDto> AverageScoreByMonth { get; set; } = new();
}

public class StudentCountByMonthDto
{
    public string Month { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class AttendanceRateByMonthDto
{
    public string Month { get; set; } = string.Empty;
    public double Rate { get; set; }
}

public class AverageScoreByMonthDto
{
    public string Month { get; set; } = string.Empty;
    public double AverageScore { get; set; }
}

public class RecentActivityDto
{
    public string Type { get; set; } = string.Empty; // "Lesson", "Exam", "Comment", "Attendance", "Class", "Student", "Teacher"
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int? EntityId { get; set; }
    public string? EntityName { get; set; }
}
