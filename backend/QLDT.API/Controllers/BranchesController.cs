using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLDT.Application.DTOs.Branch;
using QLDT.Application.Services;

namespace QLDT.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BranchesController : ControllerBase
{
    private readonly IBranchService _branchService;

    public BranchesController(IBranchService branchService)
    {
        _branchService = branchService;
    }

    /// <summary>
    /// Lấy tất cả chi nhánh
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BranchDto>>> GetAll()
    {
        var branches = await _branchService.GetAllAsync();
        return Ok(branches);
    }

    /// <summary>
    /// Lấy chi nhánh theo Owner ID
    /// </summary>
    [HttpGet("owner/{ownerId}")]
    public async Task<ActionResult<IEnumerable<BranchDto>>> GetByOwnerId(int ownerId)
    {
        var branches = await _branchService.GetByOwnerIdAsync(ownerId);
        return Ok(branches);
    }

    /// <summary>
    /// Lấy thông tin chi nhánh theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<BranchDto>> GetById(int id)
    {
        var branch = await _branchService.GetByIdAsync(id);
        if (branch == null)
            return NotFound();

        return Ok(branch);
    }

    /// <summary>
    /// Tạo chi nhánh mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<BranchDto>> Create([FromBody] CreateBranchRequest request)
    {
        var branch = await _branchService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = branch.Id }, branch);
    }

    /// <summary>
    /// Cập nhật chi nhánh
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<BranchDto>> Update(int id, [FromBody] CreateBranchRequest request)
    {
        try
        {
            var branch = await _branchService.UpdateAsync(id, request);
            return Ok(branch);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Xóa chi nhánh
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _branchService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
