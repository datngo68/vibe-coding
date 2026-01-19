using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLDT.Application.DTOs.Comment;
using QLDT.Application.Services;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    /// <summary>
    /// Lấy danh sách nhận xét theo buổi học
    /// </summary>
    [HttpGet("lesson/{lessonId}")]
    public async Task<ActionResult<IEnumerable<DailyCommentDto>>> GetByLessonId(int lessonId)
    {
        var comments = await _commentService.GetByLessonIdAsync(lessonId);
        return Ok(comments);
    }

    /// <summary>
    /// Lấy danh sách nhận xét theo học sinh
    /// </summary>
    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<IEnumerable<DailyCommentDto>>> GetByStudentId(int studentId)
    {
        var comments = await _commentService.GetByStudentIdAsync(studentId);
        return Ok(comments);
    }

    /// <summary>
    /// Lấy danh sách nhận xét theo buổi học (public, không cần auth - dùng cho shared link)
    /// </summary>
    [HttpGet("shared/lesson/{lessonId}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<DailyCommentDto>>> GetByLessonIdForShared(int lessonId)
    {
        var comments = await _commentService.GetByLessonIdAsync(lessonId);
        return Ok(comments);
    }

    /// <summary>
    /// Lấy thông tin nhận xét theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<DailyCommentDto>> GetById(int id)
    {
        var comment = await _commentService.GetByIdAsync(id);
        if (comment == null)
            return NotFound();

        return Ok(comment);
    }

    /// <summary>
    /// Tạo nhận xét mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DailyCommentDto>> Create([FromBody] CreateDailyCommentRequest request)
    {
        var comment = await _commentService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = comment.Id }, comment);
    }

    /// <summary>
    /// Cập nhật nhận xét
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<DailyCommentDto>> Update(int id, [FromBody] CreateDailyCommentRequest request)
    {
        try
        {
            var comment = await _commentService.UpdateAsync(id, request);
            return Ok(comment);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Xóa nhận xét
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _commentService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
