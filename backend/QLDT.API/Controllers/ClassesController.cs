using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Class;
using QLDT.Application.Services;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassesController : ControllerBase
{
    private readonly IClassService _classService;

    public ClassesController(IClassService classService)
    {
        _classService = classService;
    }

    /// <summary>
    /// Lấy tất cả lớp học (hoặc lớp học của giáo viên nếu là Teacher)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClassDto>>> GetAll()
    {
        // Get current user from JWT token
        var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role);

        if (userIdClaim != null && roleClaim != null && roleClaim.Value == "Teacher")
        {
            // If user is Teacher, get their teacher ID from User entity
            var userId = int.Parse(userIdClaim.Value);

            // Get user from database to check TeacherId
            using var scope = HttpContext.RequestServices.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<QLDT.Infrastructure.Data.QLDTDbContext>();
            var user = await dbContext.Users.FindAsync(userId);

            if (user != null && user.TeacherId.HasValue)
            {
                var classes = await _classService.GetByTeacherIdAsync(user.TeacherId.Value);
                return Ok(classes);
            }
        }

        // For Owner, BranchManager, or if Teacher doesn't have TeacherId linked
        var allClasses = await _classService.GetAllAsync();
        return Ok(allClasses);
    }

    /// <summary>
    /// Lấy danh sách lớp học theo giáo viên
    /// </summary>
    [HttpGet("teacher/{teacherId}")]
    public async Task<ActionResult<IEnumerable<ClassDto>>> GetByTeacherId(int teacherId)
    {
        var classes = await _classService.GetByTeacherIdAsync(teacherId);
        return Ok(classes);
    }

    /// <summary>
    /// Lấy danh sách lớp học theo chi nhánh
    /// </summary>
    [HttpGet("branch/{branchId}")]
    public async Task<ActionResult<IEnumerable<ClassDto>>> GetByBranchId(int branchId)
    {
        var classes = await _classService.GetByBranchIdAsync(branchId);
        return Ok(classes);
    }

    /// <summary>
    /// Lấy thông tin lớp học theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ClassDto>> GetById(int id)
    {
        var classEntity = await _classService.GetByIdAsync(id);
        if (classEntity == null)
            return NotFound();

        return Ok(classEntity);
    }

    /// <summary>
    /// Tạo lớp học mới (nếu là Teacher, tự động gán cho chính họ)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ClassDto>> Create([FromBody] CreateClassRequest request)
    {
        // Get current user from JWT token
        var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role);

        // If user is Teacher and no TeacherIds provided, auto-assign to themselves
        if (userIdClaim != null && roleClaim != null && roleClaim.Value == "Teacher")
        {
            var userId = int.Parse(userIdClaim.Value);
            using var scope = HttpContext.RequestServices.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<QLDT.Infrastructure.Data.QLDTDbContext>();
            var user = await dbContext.Users.FindAsync(userId);

            if (user != null && user.TeacherId.HasValue)
            {
                // Auto-assign teacher to the class
                if (request.TeacherIds == null || request.TeacherIds.Count == 0)
                {
                    request.TeacherIds = new List<int> { user.TeacherId.Value };
                }
                else if (!request.TeacherIds.Contains(user.TeacherId.Value))
                {
                    // Add current teacher to the list if not already included
                    request.TeacherIds.Add(user.TeacherId.Value);
                }
            }
        }

        var classEntity = await _classService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = classEntity.Id }, classEntity);
    }

    /// <summary>
    /// Cập nhật lớp học
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ClassDto>> Update(int id, [FromBody] CreateClassRequest request)
    {
        try
        {
            var classEntity = await _classService.UpdateAsync(id, request);
            return Ok(classEntity);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Cập nhật trạng thái hoàn thành của lớp học
    /// </summary>
    [HttpPatch("{id}/complete")]
    public async Task<ActionResult<ClassDto>> UpdateIsCompleted(int id, [FromBody] bool isCompleted)
    {
        try
        {
            await _classService.UpdateIsCompletedAsync(id, isCompleted);
            var classEntity = await _classService.GetByIdAsync(id);
            return Ok(classEntity);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Xóa lớp học
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _classService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Gán giáo viên cho lớp học
    /// </summary>
    [HttpPost("{classId}/teachers/{teacherId}")]
    public async Task<IActionResult> AssignTeacher(int classId, int teacherId)
    {
        try
        {
            await _classService.AssignTeacherAsync(classId, teacherId);
            return Ok(new { message = "Đã gán giáo viên cho lớp học thành công" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Bỏ gán giáo viên khỏi lớp học
    /// </summary>
    [HttpDelete("{classId}/teachers/{teacherId}")]
    public async Task<IActionResult> UnassignTeacher(int classId, int teacherId)
    {
        try
        {
            await _classService.UnassignTeacherAsync(classId, teacherId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
