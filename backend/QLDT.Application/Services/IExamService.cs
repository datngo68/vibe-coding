using QLDT.Application.DTOs.Exam;

namespace QLDT.Application.Services;

public interface IExamService
{
    Task<IEnumerable<ExamDto>> GetAllAsync();
    Task<ExamDto?> GetByIdAsync(int id);
    Task<IEnumerable<ExamDto>> GetByClassIdAsync(int classId);
    Task<ExamDto> CreateAsync(CreateExamRequest request);
    Task<ExamDto> UpdateAsync(int id, CreateExamRequest request);
    Task DeleteAsync(int id);
    
    // Exam Results
    Task<ExamResultDto?> GetResultByIdAsync(int id);
    Task<IEnumerable<ExamResultDto>> GetResultsByExamIdAsync(int examId);
    Task<IEnumerable<ExamResultDto>> GetResultsByStudentIdAsync(int studentId);
    Task<ExamResultDto> CreateResultAsync(CreateExamResultRequest request);
    Task<ExamResultDto> UpdateResultAsync(int id, CreateExamResultRequest request);
    Task DeleteResultAsync(int id);
}
