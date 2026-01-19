using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLDT.Application.DTOs.Teacher;
using QLDT.Application.Services;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeachersController : ControllerBase
{
    private readonly ITeacherService _teacherService;

    public TeachersController(ITeacherService teacherService)
    {
        _teacherService = teacherService;
    }

    /// <summary>
    /// Lấy tất cả giáo viên
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TeacherDto>>> GetAll()
    {
        var teachers = await _teacherService.GetAllAsync();
        return Ok(teachers);
    }

    /// <summary>
    /// Lấy danh sách giáo viên theo chi nhánh
    /// </summary>
    [HttpGet("branch/{branchId}")]
    public async Task<ActionResult<IEnumerable<TeacherDto>>> GetByBranchId(int branchId)
    {
        var teachers = await _teacherService.GetByBranchIdAsync(branchId);
        return Ok(teachers);
    }

    /// <summary>
    /// Lấy thông tin giáo viên theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TeacherDto>> GetById(int id)
    {
        var teacher = await _teacherService.GetByIdAsync(id);
        if (teacher == null)
            return NotFound();

        return Ok(teacher);
    }

    /// <summary>
    /// Tạo giáo viên mới (không tạo tài khoản)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TeacherDto>> Create([FromBody] CreateTeacherRequest request)
    {
        var teacher = await _teacherService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = teacher.Id }, teacher);
    }

    /// <summary>
    /// Tạo giáo viên mới kèm tài khoản đăng nhập
    /// </summary>
    [HttpPost("with-account")]
    public async Task<ActionResult<TeacherDto>> CreateWithAccount([FromBody] CreateTeacherWithAccountRequest request)
    {
        try
        {
            var teacher = await _teacherService.CreateWithAccountAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = teacher.Id }, teacher);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật giáo viên
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<TeacherDto>> Update(int id, [FromBody] CreateTeacherRequest request)
    {
        try
        {
            var teacher = await _teacherService.UpdateAsync(id, request);
            return Ok(teacher);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Xóa giáo viên
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _teacherService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
