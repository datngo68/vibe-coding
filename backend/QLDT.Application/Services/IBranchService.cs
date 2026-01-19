using QLDT.Application.DTOs.Branch;

namespace QLDT.Application.Services;

public interface IBranchService
{
    Task<BranchDto?> GetByIdAsync(int id);
    Task<IEnumerable<BranchDto>> GetAllAsync();
    Task<IEnumerable<BranchDto>> GetByOwnerIdAsync(int ownerId);
    Task<BranchDto> CreateAsync(CreateBranchRequest request);
    Task<BranchDto> UpdateAsync(int id, CreateBranchRequest request);
    Task DeleteAsync(int id);
}
