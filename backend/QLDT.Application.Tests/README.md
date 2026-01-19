# QLDT Application Tests

Unit tests cho các services trong Application layer.

## Chạy Tests

```bash
dotnet test QLDT.Application.Tests/QLDT.Application.Tests.csproj
```

## Cấu trúc Tests

- **Services/AuthServiceTests.cs**: Tests cho authentication service
  - Login với credentials hợp lệ
  - Login với username không tồn tại
  - Login với password sai
  - Verify JWT token generation

- **Services/ClassServiceTests.cs**: Tests cho class service
  - GetByIdAsync
  - GetByBranchIdAsync
  - CreateAsync
  - UpdateAsync
  - DeleteAsync

- **Services/StudentServiceTests.cs**: Tests cho student service
  - GetByIdAsync
  - GetByClassIdAsync
  - CreateAsync
  - UpdateAsync
  - DeleteAsync

## Dependencies

- **xUnit**: Testing framework
- **Moq**: Mocking framework
- **FluentAssertions**: Assertion library
- **Microsoft.EntityFrameworkCore.InMemory**: In-memory database cho testing
