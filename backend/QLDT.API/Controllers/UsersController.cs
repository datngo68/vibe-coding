using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLDT.Application.DTOs.User;
using QLDT.Application.DTOs.Student;
using QLDT.Application.Services;
using System.Security.Claims;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Lấy thông tin user hiện tại
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized();

        var user = await _userService.GetCurrentUserAsync(userId);
        if (user == null)
            return NotFound();

        return Ok(user);
    }

    /// <summary>
    /// Cập nhật thông tin cá nhân
    /// </summary>
    [HttpPut("me")]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized();

        try
        {
            var user = await _userService.UpdateProfileAsync(userId, request);
            return Ok(user);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Đổi mật khẩu
    /// </summary>
    [HttpPost("me/change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized();

        try
        {
            await _userService.ChangePasswordAsync(userId, request);
            return Ok(new { message = "Đổi mật khẩu thành công" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách tất cả users (chỉ Owner và BranchManager) hoặc Parents (nếu là Teacher)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
        
        // Teacher chỉ có thể xem Parents
        if (roleClaim?.Value == "Teacher")
        {
            var parents = await _userService.GetParentsAsync();
            return Ok(parents);
        }
        
        // Owner và BranchManager xem tất cả users
        if (roleClaim?.Value == "Owner" || roleClaim?.Value == "BranchManager")
        {
            var users = await _userService.GetAllAsync();
            return Ok(users);
        }
        
        return Forbid();
    }

    /// <summary>
    /// Tạo user mới (chỉ Owner và BranchManager)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Owner,BranchManager,Teacher")]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserRequest request)
    {
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
        
        // Teacher chỉ có thể tạo Parent
        if (roleClaim?.Value == "Teacher" && request.Role != "Parent")
        {
            return Forbid();
        }

        try
        {
            var user = await _userService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy thông tin user theo ID (Owner/BranchManager: tất cả, Teacher: chỉ Parent)
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
        var user = await _userService.GetByIdAsync(id);
        
        if (user == null)
            return NotFound();

        // Teacher chỉ có thể xem Parent
        if (roleClaim?.Value == "Teacher" && user.Role != "Parent")
            return Forbid();

        return Ok(user);
    }

    /// <summary>
    /// Cập nhật user (Owner/BranchManager: tất cả, Teacher: chỉ Parent)
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> Update(int id, [FromBody] CreateUserRequest request)
    {
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
        
        // Teacher chỉ có thể cập nhật Parent
        if (roleClaim?.Value == "Teacher")
        {
            var existingUser = await _userService.GetByIdAsync(id);
            if (existingUser == null)
                return NotFound();
            
            if (existingUser.Role != "Parent" || request.Role != "Parent")
                return Forbid();
        }
        
        try
        {
            var user = await _userService.UpdateAsync(id, request);
            return Ok(user);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa user (Owner/BranchManager: tất cả, Teacher: chỉ Parent)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
        
        // Teacher chỉ có thể xóa Parent
        if (roleClaim?.Value == "Teacher")
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
                return NotFound();
            
            if (user.Role != "Parent")
                return Forbid();
        }
        
        try
        {
            await _userService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Reset password cho user (Owner/BranchManager: tất cả, Teacher: chỉ Parent)
    /// </summary>
    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request)
    {
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
        
        // Teacher chỉ có thể reset password cho Parent
        if (roleClaim?.Value == "Teacher")
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
                return NotFound();
            
            if (user.Role != "Parent")
                return Forbid();
        }
        
        try
        {
            await _userService.ResetPasswordAsync(id, request.NewPassword);
            return Ok(new { message = "Đặt lại mật khẩu thành công" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Lấy danh sách học sinh của parent (trả về StudentDto)
    /// </summary>
    [HttpGet("{parentId}/students")]
    public async Task<ActionResult<IEnumerable<StudentDto>>> GetStudentsByParent(int parentId)
    {
        var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
        
        // Cho phép Owner, BranchManager, Teacher hoặc chính parent đó xem
        if (roleClaim?.Value != "Owner" && roleClaim?.Value != "BranchManager" && roleClaim?.Value != "Teacher" &&
            (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId) || userId != parentId))
        {
            return Forbid();
        }

        var studentService = HttpContext.RequestServices.GetRequiredService<IStudentService>();
        var students = await studentService.GetByParentIdAsync(parentId);
        return Ok(students);
    }

    /// <summary>
    /// Gán học sinh cho parent (chỉ Teacher, Owner, BranchManager)
    /// </summary>
    [HttpPost("{parentId}/students")]
    [Authorize(Roles = "Owner,BranchManager,Teacher")]
    public async Task<IActionResult> AssignStudents(int parentId, [FromBody] List<int> studentIds)
    {
        try
        {
            await _userService.AssignStudentsToParentAsync(parentId, studentIds);
            return Ok(new { message = "Gán học sinh thành công" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Kích hoạt tài khoản user (Owner/BranchManager: tất cả, Teacher: chỉ Parent)
    /// </summary>
    [HttpPost("{id}/activate")]
    public async Task<ActionResult<UserDto>> Activate(int id)
    {
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
        
        // Teacher chỉ có thể kích hoạt Parent
        if (roleClaim?.Value == "Teacher")
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
                return NotFound();
            
            if (user.Role != "Parent")
                return Forbid();
        }
        
        try
        {
            var user = await _userService.ActivateAsync(id);
            return Ok(user);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Vô hiệu hóa tài khoản user (Owner/BranchManager: tất cả, Teacher: chỉ Parent)
    /// </summary>
    [HttpPost("{id}/deactivate")]
    public async Task<ActionResult<UserDto>> Deactivate(int id)
    {
        var roleClaim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
        
        // Teacher chỉ có thể vô hiệu hóa Parent
        if (roleClaim?.Value == "Teacher")
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
                return NotFound();
            
            if (user.Role != "Parent")
                return Forbid();
        }
        
        try
        {
            var user = await _userService.DeactivateAsync(id);
            return Ok(user);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
