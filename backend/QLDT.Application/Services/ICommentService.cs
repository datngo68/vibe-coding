using QLDT.Application.DTOs.Comment;

namespace QLDT.Application.Services;

public interface ICommentService
{
    Task<DailyCommentDto?> GetByIdAsync(int id);
    Task<IEnumerable<DailyCommentDto>> GetByLessonIdAsync(int lessonId);
    Task<IEnumerable<DailyCommentDto>> GetByStudentIdAsync(int studentId);
    Task<DailyCommentDto> CreateAsync(CreateDailyCommentRequest request);
    Task<DailyCommentDto> UpdateAsync(int id, CreateDailyCommentRequest request);
    Task DeleteAsync(int id);
}
