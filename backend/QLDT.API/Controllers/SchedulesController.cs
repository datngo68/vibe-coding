using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLDT.Application.DTOs.Schedule;
using QLDT.Application.Services;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public SchedulesController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    /// <summary>
    /// Lấy tất cả lịch học
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ScheduleDto>>> GetAll()
    {
        var schedules = await _scheduleService.GetAllAsync();
        return Ok(schedules);
    }

    /// <summary>
    /// Lấy danh sách lịch học theo lớp
    /// </summary>
    [HttpGet("class/{classId}")]
    public async Task<ActionResult<IEnumerable<ScheduleDto>>> GetByClassId(int classId)
    {
        var schedules = await _scheduleService.GetByClassIdAsync(classId);
        return Ok(schedules);
    }

    /// <summary>
    /// Lấy thông tin lịch học theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ScheduleDto>> GetById(int id)
    {
        var schedule = await _scheduleService.GetByIdAsync(id);
        if (schedule == null)
            return NotFound();

        return Ok(schedule);
    }

    /// <summary>
    /// Tạo lịch học mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ScheduleDto>> Create([FromBody] CreateScheduleRequest request)
    {
        var schedule = await _scheduleService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = schedule.Id }, schedule);
    }

    /// <summary>
    /// Cập nhật lịch học
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ScheduleDto>> Update(int id, [FromBody] CreateScheduleRequest request)
    {
        try
        {
            var schedule = await _scheduleService.UpdateAsync(id, request);
            return Ok(schedule);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Xóa lịch học
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _scheduleService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
