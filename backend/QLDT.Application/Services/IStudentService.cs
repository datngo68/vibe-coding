using QLDT.Application.DTOs.Student;

namespace QLDT.Application.Services;

public interface IStudentService
{
    Task<StudentDto?> GetByIdAsync(int id);
    Task<IEnumerable<StudentDto>> GetByClassIdAsync(int classId);
    Task<IEnumerable<StudentDto>> GetByParentIdAsync(int parentId);
    Task<StudentDto> CreateAsync(CreateStudentRequest request);
    Task<StudentDto> UpdateAsync(int id, CreateStudentRequest request);
    Task DeleteAsync(int id);
}
