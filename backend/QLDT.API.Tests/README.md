# QLDT API Tests

Integration tests cho API endpoints.

## Chạy Tests

```bash
dotnet test QLDT.API.Tests/QLDT.API.Tests.csproj
```

## Cấu trúc Tests

- **Controllers/AuthControllerTests.cs**: Tests cho authentication endpoints
  - POST /api/auth/login với credentials hợp lệ
  - POST /api/auth/login với username không tồn tại
  - POST /api/auth/login với password sai
  - POST /api/auth/login với missing fields

- **Controllers/ClassesControllerTests.cs**: Tests cho classes endpoints
  - GET /api/classes (với và không có auth)
  - POST /api/classes
  - GET /api/classes/{id}
  - PUT /api/classes/{id}
  - DELETE /api/classes/{id}

## WebApplicationFactory

Sử dụng `CustomWebApplicationFactory` để:
- Configure in-memory database
- Seed test data
- Create test HTTP client

## Dependencies

- **Microsoft.AspNetCore.Mvc.Testing**: WebApplicationFactory
- **xUnit**: Testing framework
- **FluentAssertions**: Assertion library
- **Microsoft.EntityFrameworkCore.InMemory**: In-memory database cho testing
