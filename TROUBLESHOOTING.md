# Troubleshooting Guide - QLDT

## Lỗi CORS khi đăng nhập từ Frontend

### Vấn đề
Khi đăng nhập từ frontend, gặp lỗi CORS error.

### Giải pháp đã áp dụng

1. **Cập nhật CORS Policy** trong `backend/QLDT.API/Program.cs`:
   - Thêm các port phổ biến của Vite: `5173`, `5174`
   - Thêm cả `localhost` và `127.0.0.1`

2. **Cập nhật API URL** trong `frontend/qldt-react/src/services/api.ts`:
   - Đổi từ `http://localhost:5000/api` sang `http://localhost:5050/api`
   - Backend đang chạy trên port 5050

3. **Cải thiện Error Handling** trong `frontend/qldt-react/src/pages/auth/LoginPage.tsx`:
   - Hiển thị thông báo lỗi chi tiết hơn
   - Kiểm tra kết nối server

### Kiểm tra

1. **Backend đang chạy?**
   ```bash
   cd backend
   dotnet run --project QLDT.API
   ```
   Backend phải chạy tại: `http://localhost:5050`

2. **Frontend đang chạy?**
   ```bash
   cd frontend/qldt-react
   npm run dev
   ```
   Frontend thường chạy tại: `http://localhost:5173` (Vite) hoặc `http://localhost:3000`

3. **Kiểm tra API URL trong frontend:**
   - Mở browser console
   - Xem log "API Base URL: ..."
   - Phải là: `http://localhost:5050/api`

4. **Kiểm tra CORS headers:**
   - Mở browser DevTools > Network tab
   - Xem request login
   - Kiểm tra Response Headers có `Access-Control-Allow-Origin` không

### Tài khoản mặc định

Sau khi seed data, có 3 tài khoản:

- **Owner**: `admin` / `admin123`
- **Branch Manager**: `manager` / `manager123`
- **Teacher**: `teacher` / `teacher123`

### Nếu vẫn lỗi

1. **Xóa database và seed lại:**
   ```bash
   cd backend/QLDT.API
   Remove-Item qltd.db -ErrorAction SilentlyContinue
   dotnet run --project ../QLDT.API/QLDT.API.csproj
   ```

2. **Kiểm tra port conflict:**
   - Đảm bảo không có process nào khác đang dùng port 5050
   - Đảm bảo frontend port được thêm vào CORS policy

3. **Kiểm tra firewall/antivirus:**
   - Có thể chặn localhost connections

4. **Test API trực tiếp:**
   ```bash
   curl -X POST http://localhost:5050/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```
