namespace QLDT.Domain.Entities;

public class Schedule
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? Room { get; set; }

    // Navigation properties
    public Class Class { get; set; } = null!;
}
