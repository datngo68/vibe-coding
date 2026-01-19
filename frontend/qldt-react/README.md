# QLDT React Frontend

Frontend application cho hệ thống quản lý trung tâm tiếng Anh được xây dựng với React 19, TypeScript và Tailwind CSS.

## 🚀 Chạy Project

### Development

```bash
cd frontend/qldt-react
npm install
npm run dev
```

Application sẽ chạy tại: `http://localhost:3000`

### Build Production

```bash
npm run build
```

Output sẽ ở trong thư mục `dist/`.

### Preview Production Build

```bash
npm run preview
```

## 📦 Dependencies

### Core
- `react` (19.2.0)
- `react-dom` (19.2.0)
- `react-router-dom` (7.12.0)
- `@tanstack/react-query` (5.90.19)
- `axios` (1.13.2)

### UI & Styling
- `tailwindcss` (3.4.19)
- `autoprefixer` (10.4.23)
- `postcss` (8.5.6)

### Forms & Validation
- `react-hook-form` (7.71.1)
- `@hookform/resolvers` (5.2.2)
- `zod` (4.3.5)

### Utilities
- `date-fns` (4.1.0)
- `exceljs` (4.4.0)
- `qrcode.react` (4.2.0)

## 📁 Cấu Trúc

```
src/
├── components/          # Reusable components
│   ├── common/         # Button, Card, Input, etc.
│   └── layout/         # Header, Sidebar, BottomNav
├── pages/              # Page components
│   ├── auth/          # LoginPage
│   ├── dashboard/     # DashboardPage
│   ├── lessons/       # LessonsPage, LessonDetailPage
│   ├── comments/      # CommentsPage
│   ├── exams/         # ExamsPage, ExamDetailPage
│   ├── classes/       # ClassesPage
│   └── students/      # StudentsPage
├── services/           # API services
│   ├── api.ts        # Axios instance
│   └── auth.ts       # Auth service
├── hooks/             # Custom hooks
│   └── useAuth.ts    # Authentication hook
├── types/             # TypeScript types
│   └── index.ts      # All type definitions
└── App.tsx            # Main app component
```

## 🎨 Design System

Project tuân thủ design system tại `design-system/qldt---quản-lý-trung-tâm-tiếng-anh/MASTER.md`.

### Colors
- Primary: `#7C3AED`
- Secondary: `#A78BFA`
- CTA: `#F97316`
- Background: `#FAF5FF`
- Text: `#4C1D95`

### Typography
- Heading: Fira Code
- Body: Fira Sans

## 📱 Mobile Optimization

- Responsive design cho màn hình từ 375px
- Bottom navigation cho mobile (`lg:hidden`)
- Touch-friendly với minimum 44px touch targets
- Safe area support cho iOS
- Horizontal scroll cho tables

## 🔌 API Integration

API base URL được cấu hình thông qua environment variable `VITE_API_URL` trong file `.env.local`:

```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

### Authentication

Token được lưu trong `localStorage` và tự động thêm vào request headers thông qua axios interceptor:

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🧪 Testing

```bash
# Lint
npm run lint

# Type check
npm run build
```

## 📝 Environment Variables

### Setup

1. Copy file `.env.example` thành `.env.local`:

```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# Linux/Mac
cp .env.example .env.local
```

2. Chỉnh sửa `.env.local` với cấu hình của bạn:

```env
# API Configuration
# Base URL của backend API
VITE_API_URL=http://localhost:5000/api

# Environment
# development | production
VITE_ENV=development
```

### Các file environment

- `.env.example` - Template file (nên commit vào git)
- `.env.local` - Local development (gitignore, không commit)
- `.env.development.local` - Development environment override
- `.env.production.local` - Production environment override

### Lưu ý

- **Vite chỉ expose các biến môi trường có prefix `VITE_`**
- File `.env.local` được gitignore và không commit lên repository
- File `.env.example` là template và nên được commit
- Thứ tự ưu tiên: `.env.local` > `.env.development.local` > `.env`
- Sau khi thay đổi `.env`, cần restart dev server

## 🎯 Features

- ✅ Authentication với JWT
- ✅ Protected routes
- ✅ React Query cho data fetching và caching
- ✅ Form handling với React Hook Form
- ✅ Excel export (client-side)
- ✅ Responsive design
- ✅ Mobile-first approach
- ✅ TypeScript cho type safety

## 📚 Thêm Thông Tin

Xem `README.md` ở root để có thông tin tổng quan về toàn bộ project.
