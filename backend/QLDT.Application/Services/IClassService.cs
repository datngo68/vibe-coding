using QLDT.Application.DTOs.Class;

namespace QLDT.Application.Services;

public interface IClassService
{
    Task<IEnumerable<ClassDto>> GetAllAsync();
    Task<IEnumerable<ClassDto>> GetByTeacherIdAsync(int teacherId);
    Task<ClassDto?> GetByIdAsync(int id);
    Task<IEnumerable<ClassDto>> GetByBranchIdAsync(int branchId);
    Task<ClassDto> CreateAsync(CreateClassRequest request);
    Task<ClassDto> UpdateAsync(int id, CreateClassRequest request);
    Task DeleteAsync(int id);
    Task AssignTeacherAsync(int classId, int teacherId);
    Task UnassignTeacherAsync(int classId, int teacherId);
    Task UpdateIsCompletedAsync(int classId, bool isCompleted);
}
