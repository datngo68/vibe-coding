using AutoMapper;
using Microsoft.EntityFrameworkCore;
using QLDT.Application.DTOs.Branch;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;

namespace QLDT.Application.Services;

public class BranchService : IBranchService
{
    private readonly IRepository<Branch> _branchRepository;
    private readonly IQLDTDbContext _context;
    private readonly IMapper _mapper;

    public BranchService(
        IRepository<Branch> branchRepository,
        IQLDTDbContext context,
        IMapper mapper)
    {
        _branchRepository = branchRepository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<BranchDto?> GetByIdAsync(int id)
    {
        var branch = await _branchRepository.GetByIdAsync(id);
        if (branch == null) return null;
        return _mapper.Map<BranchDto>(branch);
    }

    public async Task<IEnumerable<BranchDto>> GetAllAsync()
    {
        var branches = await _context.Branches
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
        return _mapper.Map<IEnumerable<BranchDto>>(branches);
    }

    public async Task<IEnumerable<BranchDto>> GetByOwnerIdAsync(int ownerId)
    {
        var branches = await _context.Branches
            .Where(b => b.OwnerId == ownerId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
        return _mapper.Map<IEnumerable<BranchDto>>(branches);
    }

    public async Task<BranchDto> CreateAsync(CreateBranchRequest request)
    {
        var branch = _mapper.Map<Branch>(request);
        var created = await _branchRepository.AddAsync(branch);
        return _mapper.Map<BranchDto>(created);
    }

    public async Task<BranchDto> UpdateAsync(int id, CreateBranchRequest request)
    {
        var branch = await _branchRepository.GetByIdAsync(id);
        if (branch == null)
            throw new KeyNotFoundException($"Branch with id {id} not found");

        _mapper.Map(request, branch);
        await _branchRepository.UpdateAsync(branch);

        return _mapper.Map<BranchDto>(branch);
    }

    public async Task DeleteAsync(int id)
    {
        var branch = await _branchRepository.GetByIdAsync(id);
        if (branch == null)
            throw new KeyNotFoundException($"Branch with id {id} not found");

        await _branchRepository.DeleteAsync(branch);
    }
}
