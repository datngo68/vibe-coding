using Microsoft.AspNetCore.Mvc;
using QLDT.Application.DTOs.Auth;
using QLDT.Application.Services;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Đăng nhập vào hệ thống
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        if (response == null)
            return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không đúng" });

        return Ok(response);
    }

    /// <summary>
    /// Làm mới token
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<string>> RefreshToken([FromBody] string refreshToken)
    {
        var token = await _authService.RefreshTokenAsync(refreshToken);
        if (token == null)
            return Unauthorized();

        return Ok(new { token });
    }
}
