namespace QLDT.Application.DTOs.Class;

public class CreateClassRequest
{
    public int BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Level { get; set; }
    public List<int>? TeacherIds { get; set; } // Optional: Danh sách ID giáo viên để gán cho lớp học
}
