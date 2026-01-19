namespace QLDT.Domain.Entities;

public class Teacher
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Branch Branch { get; set; } = null!;
    public ICollection<ClassTeacher> ClassTeachers { get; set; } = new List<ClassTeacher>();
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<Exam> Exams { get; set; } = new List<Exam>();
}
