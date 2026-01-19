using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLDT.Application.DTOs.Exam;
using QLDT.Application.Services;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExamsController : ControllerBase
{
    private readonly IExamService _examService;

    public ExamsController(IExamService examService)
    {
        _examService = examService;
    }

    /// <summary>
    /// Lấy tất cả bài kiểm tra
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExamDto>>> GetAll()
    {
        var exams = await _examService.GetAllAsync();
        return Ok(exams);
    }

    /// <summary>
    /// Lấy danh sách bài kiểm tra theo lớp
    /// </summary>
    [HttpGet("class/{classId}")]
    public async Task<ActionResult<IEnumerable<ExamDto>>> GetByClassId(int classId)
    {
        var exams = await _examService.GetByClassIdAsync(classId);
        return Ok(exams);
    }

    /// <summary>
    /// Lấy thông tin bài kiểm tra theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ExamDto>> GetById(int id)
    {
        var exam = await _examService.GetByIdAsync(id);
        if (exam == null)
            return NotFound();

        return Ok(exam);
    }

    /// <summary>
    /// Lấy thông tin bài kiểm tra theo ID (public, không cần auth - dùng cho shared link)
    /// </summary>
    [HttpGet("shared/{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ExamDto>> GetByIdForShared(int id)
    {
        var exam = await _examService.GetByIdAsync(id);
        if (exam == null)
            return NotFound();

        return Ok(exam);
    }

    /// <summary>
    /// Lấy danh sách kết quả kiểm tra theo bài kiểm tra (public, không cần auth - dùng cho shared link)
    /// </summary>
    [HttpGet("shared/{examId}/results")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ExamResultDto>>> GetResultsForShared(int examId)
    {
        var results = await _examService.GetResultsByExamIdAsync(examId);
        return Ok(results);
    }

    /// <summary>
    /// Tạo bài kiểm tra mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ExamDto>> Create([FromBody] CreateExamRequest request)
    {
        var exam = await _examService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = exam.Id }, exam);
    }

    /// <summary>
    /// Cập nhật bài kiểm tra
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ExamDto>> Update(int id, [FromBody] CreateExamRequest request)
    {
        try
        {
            var exam = await _examService.UpdateAsync(id, request);
            return Ok(exam);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Xóa bài kiểm tra
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _examService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Lấy danh sách kết quả kiểm tra theo bài kiểm tra
    /// </summary>
    [HttpGet("{examId}/results")]
    public async Task<ActionResult<IEnumerable<ExamResultDto>>> GetResults(int examId)
    {
        var results = await _examService.GetResultsByExamIdAsync(examId);
        return Ok(results);
    }

    /// <summary>
    /// Lấy danh sách kết quả kiểm tra theo học sinh
    /// </summary>
    [HttpGet("results/student/{studentId}")]
    public async Task<ActionResult<IEnumerable<ExamResultDto>>> GetResultsByStudentId(int studentId)
    {
        var results = await _examService.GetResultsByStudentIdAsync(studentId);
        return Ok(results);
    }

    /// <summary>
    /// Tạo kết quả kiểm tra mới
    /// </summary>
    [HttpPost("results")]
    public async Task<ActionResult<ExamResultDto>> CreateResult([FromBody] CreateExamResultRequest request)
    {
        var result = await _examService.CreateResultAsync(request);
        return CreatedAtAction(nameof(GetResultById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Lấy thông tin kết quả kiểm tra theo ID
    /// </summary>
    [HttpGet("results/{id}")]
    public async Task<ActionResult<ExamResultDto>> GetResultById(int id)
    {
        var result = await _examService.GetResultByIdAsync(id);
        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Cập nhật kết quả kiểm tra
    /// </summary>
    [HttpPut("results/{id}")]
    public async Task<ActionResult<ExamResultDto>> UpdateResult(int id, [FromBody] CreateExamResultRequest request)
    {
        try
        {
            var result = await _examService.UpdateResultAsync(id, request);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Xóa kết quả kiểm tra
    /// </summary>
    [HttpDelete("results/{id}")]
    public async Task<IActionResult> DeleteResult(int id)
    {
        try
        {
            await _examService.DeleteResultAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
