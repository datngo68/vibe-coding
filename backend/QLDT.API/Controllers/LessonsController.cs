using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLDT.Application.DTOs.Lesson;
using QLDT.Application.Services;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LessonsController : ControllerBase
{
    private readonly ILessonService _lessonService;

    public LessonsController(ILessonService lessonService)
    {
        _lessonService = lessonService;
    }

    /// <summary>
    /// Lấy tất cả buổi học
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LessonDto>>> GetAll()
    {
        var lessons = await _lessonService.GetAllAsync();
        return Ok(lessons);
    }

    /// <summary>
    /// Lấy danh sách buổi học theo lớp
    /// </summary>
    [HttpGet("class/{classId}")]
    public async Task<ActionResult<IEnumerable<LessonDto>>> GetByClassId(int classId)
    {
        var lessons = await _lessonService.GetByClassIdAsync(classId);
        return Ok(lessons);
    }

    /// <summary>
    /// Lấy thông tin buổi học theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<LessonDto>> GetById(int id)
    {
        var lesson = await _lessonService.GetByIdAsync(id);
        if (lesson == null)
            return NotFound();

        return Ok(lesson);
    }

    /// <summary>
    /// Lấy thông tin buổi học theo ID (public, không cần auth - dùng cho shared link)
    /// </summary>
    [HttpGet("shared/{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<LessonDto>> GetByIdForShared(int id)
    {
        var lesson = await _lessonService.GetByIdAsync(id);
        if (lesson == null)
            return NotFound();

        return Ok(lesson);
    }

    /// <summary>
    /// Tạo buổi học mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<LessonDto>> Create([FromBody] CreateLessonRequest request)
    {
        var lesson = await _lessonService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = lesson.Id }, lesson);
    }

    /// <summary>
    /// Cập nhật buổi học
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<LessonDto>> Update(int id, [FromBody] CreateLessonRequest request)
    {
        try
        {
            var lesson = await _lessonService.UpdateAsync(id, request);
            return Ok(lesson);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Xóa buổi học
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _lessonService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
