# QLDT - Hệ Thống Quản Lý Trung Tâm Tiếng Anh

Hệ thống quản lý toàn diện cho trung tâm tiếng Anh với hỗ trợ đa chi nhánh, quản lý lớp học, học sinh, giáo viên, buổi học, nhận xét và bài kiểm tra.

## 📋 Mục Lục

- [Tính Năng](#tính-năng)
- [Công Nghệ](#công-nghệ)
- [Cấu Trúc Project](#cấu-trúc-project)
- [Cài Đặt](#cài-đặt)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Cấu Trúc Database](#cấu-trúc-database)

## ✨ Tính Năng

### Quản Lý Tổng Quan
- ✅ **Đa chi nhánh**: Quản lý nhiều chi nhánh cho một chủ trung tâm
- ✅ **Quản lý lớp học**: Tạo và quản lý các lớp học với nhiều giáo viên
- ✅ **Quản lý học sinh**: Quản lý thông tin học sinh và phụ huynh
- ✅ **Quản lý giáo viên**: Quản lý thông tin giáo viên theo chi nhánh

### Chức Năng Giáo Viên
- ✅ **Nhập nội dung buổi học**: Vocabulary và Homework (theo mẫu)
- ✅ **Nhận xét hàng ngày**: Điểm số và nhận xét cho từng học sinh
- ✅ **Quản lý bài kiểm tra**: Tạo và nhập điểm Speaking/Listening/Reading&Writing
- ✅ **Điểm danh**: Theo dõi điểm danh học sinh
- ✅ **Lịch học**: Quản lý lịch học của các lớp

### Xuất và Chia Sẻ
- ✅ **Xuất Excel**: Xuất nội dung buổi học, nhận xét và bài kiểm tra ra file Excel
- ✅ **Chia sẻ link**: Tạo link công khai với QR code để chia sẻ kết quả

### Frontend
- ✅ **Responsive Design**: Tối ưu cho mobile (375px+)
- ✅ **Bottom Navigation**: Navigation bar cho mobile
- ✅ **Design System**: Tuân thủ UI/UX guidelines
- ✅ **Touch-friendly**: Tối ưu cho thiết bị cảm ứng

## 🛠 Công Nghệ

### Backend
- **.NET 9.0**: ASP.NET Core Web API
- **SQLite**: Database (có thể nâng cấp lên SQL Server/PostgreSQL)
- **Entity Framework Core**: ORM
- **JWT Authentication**: Xác thực và phân quyền
- **Swagger/OpenAPI**: API Documentation
- **AutoMapper**: Object mapping
- **BCrypt**: Password hashing
- **EPPlus**: Excel export

### Frontend
- **React 19**: UI Framework
- **TypeScript**: Type safety
- **Tailwind CSS 3**: Styling
- **React Router**: Routing
- **React Query**: Data fetching và caching
- **Axios**: HTTP client
- **React Hook Form**: Form handling
- **Date-fns**: Date manipulation
- **Vite**: Build tool

### Testing
- **xUnit**: Testing framework
- **Moq**: Mocking
- **FluentAssertions**: Assertions
- **Microsoft.AspNetCore.Mvc.Testing**: Integration testing

## 📁 Cấu Trúc Project

```
QLDT/
├── backend/                    # Backend API
│   ├── QLDT.API/             # API Layer (Controllers, Program.cs)
│   ├── QLDT.Application/      # Application Layer (Services, DTOs)
│   ├── QLDT.Domain/           # Domain Layer (Entities, Value Objects)
│   ├── QLDT.Infrastructure/   # Infrastructure Layer (DbContext, Repositories)
│   ├── QLDT.Application.Tests/ # Unit Tests
│   └── QLDT.API.Tests/        # Integration Tests
├── frontend/                   # Frontend React App
│   └── qldt-react/
│       ├── src/
│       │   ├── components/    # Reusable components
│       │   ├── pages/         # Page components
│       │   ├── services/      # API services
│       │   ├── hooks/         # Custom hooks
│       │   └── types/         # TypeScript types
│       └── ...
└── design-system/              # Design system documentation
```

## 🚀 Cài Đặt

### Yêu Cầu Hệ Thống

- **.NET 9.0 SDK**: [Download](https://dotnet.microsoft.com/download)
- **Node.js 18+**: [Download](https://nodejs.org/)
- **Git**: [Download](https://git-scm.com/)

### Backend Setup

```bash
cd backend

# Restore packages
dotnet restore

# Build solution
dotnet build

# Run migrations (tự động tạo database khi chạy lần đầu)
dotnet run --project QLDT.API
```

Backend sẽ chạy tại: `http://localhost:5000` hoặc `https://localhost:5001`

Swagger UI: `http://localhost:5000/swagger`

### Frontend Setup

```bash
cd frontend/qldt-react

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

### Build Production

```bash
# Backend
cd backend
dotnet publish QLDT.API/QLDT.API.csproj -c Release -o ./publish

# Frontend
cd frontend/qldt-react
npm run build
```

## 📚 API Documentation

API documentation có sẵn tại Swagger UI khi chạy backend:

- **Development**: `http://localhost:5000/swagger`
- **Production**: `https://your-domain.com/swagger`

### Authentication

Tất cả endpoints (trừ `/api/auth/login`) yêu cầu JWT Bearer token:

```
Authorization: Bearer <your-token>
```

### Main Endpoints

#### Authentication
- `POST /api/auth/login` - Đăng nhập

#### Branches (Chi nhánh)
- `GET /api/branches` - Lấy tất cả chi nhánh
- `GET /api/branches/{id}` - Lấy chi nhánh theo ID
- `POST /api/branches` - Tạo chi nhánh mới
- `PUT /api/branches/{id}` - Cập nhật chi nhánh
- `DELETE /api/branches/{id}` - Xóa chi nhánh

#### Classes (Lớp học)
- `GET /api/classes/branch/{branchId}` - Lấy lớp học theo chi nhánh
- `GET /api/classes/{id}` - Lấy lớp học theo ID
- `POST /api/classes` - Tạo lớp học mới
- `PUT /api/classes/{id}` - Cập nhật lớp học
- `DELETE /api/classes/{id}` - Xóa lớp học

#### Students (Học sinh)
- `GET /api/students/class/{classId}` - Lấy học sinh theo lớp
- `GET /api/students/{id}` - Lấy học sinh theo ID
- `POST /api/students` - Tạo học sinh mới
- `PUT /api/students/{id}` - Cập nhật học sinh
- `DELETE /api/students/{id}` - Xóa học sinh

#### Lessons (Buổi học)
- `GET /api/lessons/class/{classId}` - Lấy buổi học theo lớp
- `GET /api/lessons/{id}` - Lấy buổi học theo ID
- `POST /api/lessons` - Tạo buổi học mới
- `PUT /api/lessons/{id}` - Cập nhật buổi học
- `DELETE /api/lessons/{id}` - Xóa buổi học

#### Comments (Nhận xét)
- `GET /api/comments/lesson/{lessonId}` - Lấy nhận xét theo buổi học
- `POST /api/comments` - Tạo nhận xét mới
- `PUT /api/comments/{id}` - Cập nhật nhận xét
- `DELETE /api/comments/{id}` - Xóa nhận xét

#### Exams (Bài kiểm tra)
- `GET /api/exams/class/{classId}` - Lấy bài kiểm tra theo lớp
- `GET /api/exams/{id}` - Lấy bài kiểm tra theo ID
- `POST /api/exams` - Tạo bài kiểm tra mới
- `GET /api/exams/{id}/results` - Lấy kết quả bài kiểm tra

#### Export
- `GET /api/export/lesson/{lessonId}` - Xuất buổi học ra Excel
- `GET /api/export/comments/{lessonId}` - Xuất nhận xét ra Excel
- `GET /api/export/exam/{examId}` - Xuất bài kiểm tra ra Excel

#### Shared Links
- `POST /api/sharedlinks` - Tạo link chia sẻ
- `GET /api/sharedlinks/{token}` - Xem link chia sẻ (public)
- `DELETE /api/sharedlinks/{id}` - Xóa link chia sẻ

## 🧪 Testing

### Unit Tests

```bash
cd backend
dotnet test QLDT.Application.Tests/QLDT.Application.Tests.csproj
```

### Integration Tests

```bash
cd backend
dotnet test QLDT.API.Tests/QLDT.API.Tests.csproj
```

### Tất Cả Tests

```bash
cd backend
dotnet test
```

## 🗄 Cấu Trúc Database

### Entities Chính

- **Owner**: Chủ trung tâm
- **Branch**: Chi nhánh
- **Class**: Lớp học
- **Student**: Học sinh
- **Teacher**: Giáo viên
- **ClassTeacher**: Quan hệ nhiều-nhiều giữa Class và Teacher
- **Lesson**: Buổi học
- **DailyComment**: Nhận xét hàng ngày
- **Exam**: Bài kiểm tra
- **ExamResult**: Kết quả bài kiểm tra
- **Attendance**: Điểm danh
- **Schedule**: Lịch học
- **SharedLink**: Link chia sẻ
- **User**: Người dùng hệ thống

### Roles

- **Owner**: Chủ trung tâm
- **BranchManager**: Quản lý chi nhánh
- **Teacher**: Giáo viên
- **Parent**: Phụ huynh

## 🔧 Cấu Hình

### Backend Configuration

File `backend/QLDT.API/appsettings.json`:

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
  }
}
```

### Frontend Configuration

File `frontend/qldt-react/src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:5000/api';
```

## 📱 Mobile Optimization

- Responsive design cho màn hình từ 375px
- Bottom navigation cho mobile
- Touch-friendly với minimum 44px touch targets
- Safe area support cho iOS devices
- Horizontal scroll cho tables trên mobile

## 🤝 Đóng Góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Development Team

## 🙏 Acknowledgments

- Design system guidelines từ ui-ux-pro-max
- Tailwind CSS community
- .NET community
