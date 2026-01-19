namespace QLDT.Domain.Entities;

public class ClassTeacher
{
    public int ClassId { get; set; }
    public int TeacherId { get; set; }

    // Navigation properties
    public Class Class { get; set; } = null!;
    public Teacher Teacher { get; set; } = null!;
}
