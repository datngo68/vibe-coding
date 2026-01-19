using QLDT.Application.DTOs.Teacher;

namespace QLDT.Application.Services;

public interface ITeacherService
{
    Task<IEnumerable<TeacherDto>> GetAllAsync();
    Task<TeacherDto?> GetByIdAsync(int id);
    Task<IEnumerable<TeacherDto>> GetByBranchIdAsync(int branchId);
    Task<TeacherDto> CreateAsync(CreateTeacherRequest request);
    Task<TeacherDto> CreateWithAccountAsync(CreateTeacherWithAccountRequest request);
    Task<TeacherDto> UpdateAsync(int id, CreateTeacherRequest request);
    Task DeleteAsync(int id);
}
