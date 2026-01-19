using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLDT.Application.DTOs.Student;
using QLDT.Application.Services;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _studentService;

    public StudentsController(IStudentService studentService)
    {
        _studentService = studentService;
    }

    /// <summary>
    /// Lấy danh sách học sinh theo lớp
    /// </summary>
    [HttpGet("class/{classId}")]
    public async Task<ActionResult<IEnumerable<StudentDto>>> GetByClassId(int classId)
    {
        var students = await _studentService.GetByClassIdAsync(classId);
        return Ok(students);
    }

    /// <summary>
    /// Lấy thông tin học sinh theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<StudentDto>> GetById(int id)
    {
        var student = await _studentService.GetByIdAsync(id);
        if (student == null)
            return NotFound();

        return Ok(student);
    }

    /// <summary>
    /// Tạo học sinh mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<StudentDto>> Create([FromBody] CreateStudentRequest request)
    {
        var student = await _studentService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = student.Id }, student);
    }

    /// <summary>
    /// Cập nhật học sinh
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<StudentDto>> Update(int id, [FromBody] CreateStudentRequest request)
    {
        try
        {
            var student = await _studentService.UpdateAsync(id, request);
            return Ok(student);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Xóa học sinh
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _studentService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
