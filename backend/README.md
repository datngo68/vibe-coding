# QLDT Backend API

Backend API cho hệ thống quản lý trung tâm tiếng Anh được xây dựng với .NET 9.0 và Clean Architecture.

## 🏗 Kiến Trúc

Project sử dụng Clean Architecture với các layers:

- **QLDT.API**: API Layer - Controllers, Program.cs, Middleware
- **QLDT.Application**: Application Layer - Services, DTOs, Interfaces
- **QLDT.Domain**: Domain Layer - Entities, Value Objects
- **QLDT.Infrastructure**: Infrastructure Layer - DbContext, Repositories, Migrations

## 🚀 Chạy Project

### Development

```bash
cd backend
dotnet restore
dotnet run --project QLDT.API
```

API sẽ chạy tại:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger: `http://localhost:5000/swagger`

### Production Build

```bash
dotnet publish QLDT.API/QLDT.API.csproj -c Release -o ./publish
```

## 📦 Dependencies

### Core Packages
- `Microsoft.EntityFrameworkCore.Sqlite` (9.0.0)
- `Microsoft.EntityFrameworkCore.Design` (9.0.0)
- `Microsoft.AspNetCore.Authentication.JwtBearer` (9.0.0)
- `Swashbuckle.AspNetCore` (6.5.0)
- `AutoMapper.Extensions.Microsoft.DependencyInjection` (12.0.1)
- `BCrypt.Net-Next` (4.0.3)
- `EPPlus` (8.4.1)

## 🗄 Database

### SQLite (Development)

Database file: `qltd.db` (tự động tạo khi chạy lần đầu)

### Migrations

```bash
# Tạo migration mới
dotnet ef migrations add MigrationName --project QLDT.Infrastructure --startup-project QLDT.API

# Apply migrations
dotnet ef database update --project QLDT.Infrastructure --startup-project QLDT.API
```

## 🔐 Authentication

API sử dụng JWT Bearer Authentication. Để lấy token:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": 1,
    "username": "your-username",
    "email": "email@example.com",
    "role": "Teacher",
    "branchId": 1
  }
}
```

Sử dụng token trong các request tiếp theo:
```
Authorization: Bearer <token>
```

## 🧪 Testing

### Unit Tests

```bash
dotnet test QLDT.Application.Tests/QLDT.Application.Tests.csproj
```

### Integration Tests

```bash
dotnet test QLDT.API.Tests/QLDT.API.Tests.csproj
```

Xem chi tiết tại:
- `QLDT.Application.Tests/README.md`
- `QLDT.API.Tests/README.md`

## 📝 API Endpoints

Xem Swagger UI tại `http://localhost:5000/swagger` để có documentation đầy đủ.

### Main Controllers

- `/api/auth` - Authentication
- `/api/branches` - Chi nhánh
- `/api/classes` - Lớp học
- `/api/students` - Học sinh
- `/api/teachers` - Giáo viên
- `/api/lessons` - Buổi học
- `/api/comments` - Nhận xét
- `/api/exams` - Bài kiểm tra
- `/api/attendance` - Điểm danh
- `/api/schedules` - Lịch học
- `/api/export` - Xuất Excel
- `/api/sharedlinks` - Link chia sẻ

## ⚙️ Configuration

### appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=qltd.db"
  },
  "Jwt": {
    "SecretKey": "YourSuperSecretKeyThatShouldBeAtLeast32CharactersLong!",
    "Issuer": "QLDT",
    "Audience": "QLDT",
    "ExpirationMinutes": 60
  },
  "EPPlus": {
    "LicenseContext": "NonCommercial"
  }
}
```

### CORS

CORS được cấu hình để cho phép frontend tại `http://localhost:3000`.

## 🔄 Clean Architecture Principles

- **Dependency Rule**: Dependencies chỉ hướng vào trong (Domain là core, không phụ thuộc vào layer khác)
- **Separation of Concerns**: Mỗi layer có trách nhiệm riêng
- **Dependency Injection**: Sử dụng DI container của .NET
- **Repository Pattern**: Abstraction cho data access
- **DTOs**: Data Transfer Objects để tách biệt domain models và API contracts

## 📚 Thêm Thông Tin

Xem `README.md` ở root để có thông tin tổng quan về toàn bộ project.
