using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLDT.Application.DTOs.Attendance;
using QLDT.Application.Services;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    /// <summary>
    /// Lấy danh sách điểm danh theo buổi học
    /// </summary>
    [HttpGet("lesson/{lessonId}")]
    public async Task<ActionResult<IEnumerable<AttendanceDto>>> GetByLessonId(int lessonId)
    {
        var attendances = await _attendanceService.GetByLessonIdAsync(lessonId);
        return Ok(attendances);
    }

    /// <summary>
    /// Lấy danh sách điểm danh theo học sinh
    /// </summary>
    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<IEnumerable<AttendanceDto>>> GetByStudentId(int studentId)
    {
        var attendances = await _attendanceService.GetByStudentIdAsync(studentId);
        return Ok(attendances);
    }

    /// <summary>
    /// Lấy thông tin điểm danh theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AttendanceDto>> GetById(int id)
    {
        var attendance = await _attendanceService.GetByIdAsync(id);
        if (attendance == null)
            return NotFound();

        return Ok(attendance);
    }

    /// <summary>
    /// Tạo điểm danh mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AttendanceDto>> Create([FromBody] CreateAttendanceRequest request)
    {
        var attendance = await _attendanceService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = attendance.Id }, attendance);
    }

    /// <summary>
    /// Cập nhật điểm danh
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<AttendanceDto>> Update(int id, [FromBody] CreateAttendanceRequest request)
    {
        try
        {
            var attendance = await _attendanceService.UpdateAsync(id, request);
            return Ok(attendance);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Xóa điểm danh
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _attendanceService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
