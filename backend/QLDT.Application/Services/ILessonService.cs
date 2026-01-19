using QLDT.Application.DTOs.Lesson;

namespace QLDT.Application.Services;

public interface ILessonService
{
    Task<IEnumerable<LessonDto>> GetAllAsync();
    Task<LessonDto?> GetByIdAsync(int id);
    Task<IEnumerable<LessonDto>> GetByClassIdAsync(int classId);
    Task<LessonDto> CreateAsync(CreateLessonRequest request);
    Task<LessonDto> UpdateAsync(int id, CreateLessonRequest request);
    Task DeleteAsync(int id);
}
