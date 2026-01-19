namespace QLDT.Domain.Entities;

public class Class
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Level { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Branch Branch { get; set; } = null!;
    public ICollection<Student> Students { get; set; } = new List<Student>();
    public ICollection<ClassTeacher> ClassTeachers { get; set; } = new List<ClassTeacher>();
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<Exam> Exams { get; set; } = new List<Exam>();
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
}
