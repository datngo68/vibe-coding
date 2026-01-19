using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLDT.Application.Services;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly IExportService _exportService;

    public ExportController(IExportService exportService)
    {
        _exportService = exportService;
    }

    /// <summary>
    /// Xuất nội dung bài học ra Excel
    /// </summary>
    [HttpGet("lesson/{lessonId}")]
    public async Task<IActionResult> ExportLesson(int lessonId)
    {
        try
        {
            var fileBytes = await _exportService.ExportLessonToExcelAsync(lessonId);
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                $"Lesson_{lessonId}_{DateTime.Now:yyyyMMdd}.xlsx");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Xuất nhận xét hàng ngày ra Excel
    /// </summary>
    [HttpGet("comments/{lessonId}")]
    public async Task<IActionResult> ExportComments(int lessonId)
    {
        try
        {
            var fileBytes = await _exportService.ExportDailyCommentsToExcelAsync(lessonId);
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                $"Comments_{lessonId}_{DateTime.Now:yyyyMMdd}.xlsx");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Xuất bài kiểm tra ra Excel
    /// </summary>
    [HttpGet("exam/{examId}")]
    public async Task<IActionResult> ExportExam(int examId)
    {
        try
        {
            var fileBytes = await _exportService.ExportExamToExcelAsync(examId);
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                $"Exam_{examId}_{DateTime.Now:yyyyMMdd}.xlsx");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
