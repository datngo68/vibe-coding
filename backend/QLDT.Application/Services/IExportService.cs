namespace QLDT.Application.Services;

public interface IExportService
{
    Task<byte[]> ExportLessonToExcelAsync(int lessonId);
    Task<byte[]> ExportDailyCommentsToExcelAsync(int lessonId);
    Task<byte[]> ExportExamToExcelAsync(int examId);
}
