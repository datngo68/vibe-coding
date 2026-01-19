# Danh Sách Màn Hình và Chức Năng Frontend - QLDT

Tài liệu này liệt kê tất cả các màn hình và chức năng cần phát triển cho hệ thống quản lý trung tâm tiếng Anh.

## 📊 Tổng Quan

- **Tổng số màn hình**: 20+
- **Trạng thái**: ✅ Đã hoàn thành | ⏳ Đang phát triển | ❌ Chưa bắt đầu

---

## 🔐 1. Xác Thực (Authentication)

### 1.1. Đăng Nhập (LoginPage)
**Route**: `/login`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Form đăng nhập (username/password)
- ✅ Validation form
- ✅ Error handling
- ✅ Redirect sau khi đăng nhập thành công
- ✅ Lưu token vào localStorage

**Cần cải thiện**:
- ⏳ Remember me
- ⏳ Forgot password
- ⏳ Social login (nếu cần)

---

## 🏠 2. Dashboard

### 2.1. Trang Chủ (DashboardPage)
**Route**: `/dashboard`  
**Trạng thái**: ⏳ Cần phát triển

**Chức năng hiện tại**:
- ✅ Hiển thị trang dashboard cơ bản

**Chức năng cần thêm**:
- ❌ Thống kê tổng quan:
  - Số lượng chi nhánh
  - Số lượng lớp học
  - Số lượng học sinh
  - Số lượng giáo viên
- ❌ Biểu đồ thống kê:
  - Biểu đồ số lượng học sinh theo tháng
  - Biểu đồ điểm số trung bình
  - Biểu đồ điểm danh
- ❌ Danh sách hoạt động gần đây
- ❌ Thông báo quan trọng
- ❌ Quick actions (tạo nhanh lớp học, học sinh, v.v.)

---

## 🏢 3. Quản Lý Chi Nhánh (Branches)

### 3.1. Danh Sách Chi Nhánh (BranchesPage)
**Route**: `/branches`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị danh sách chi nhánh dạng grid (theo design system)
- ✅ Tạo chi nhánh mới (modal với form validation)
- ✅ Loading state với spinner
- ✅ Empty state với icon và CTA
- ✅ Error handling với thông báo rõ ràng
- ✅ Responsive design (mobile-first)
- ✅ SVG icons (không dùng emoji)
- ✅ Hover effects và transitions mượt

**Cần cải thiện**:
- ✅ Tìm kiếm chi nhánh (theo tên, địa chỉ, điện thoại)
- ⏳ Lọc theo owner (có thể thêm sau nếu cần)
- ✅ Sắp xếp (theo tên, ngày tạo)
- ✅ Pagination (6, 12, 24, 48 items/trang)

### 3.2. Chi Tiết Chi Nhánh (BranchDetailPage)
**Route**: `/branches/:id`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị thông tin chi nhánh (theo design system)
- ✅ Sửa chi nhánh (modal với form validation)
- ✅ Xóa chi nhánh (confirmation dialog với variant danger)
- ✅ Danh sách lớp học thuộc chi nhánh (grid layout)
- ✅ Navigate đến chi tiết lớp học
- ✅ Auto-refresh cache sau khi update/delete
- ✅ Loading states và error handling
- ✅ Responsive design
- ✅ SVG icons và hover effects

**Cần cải thiện**:
- ⏳ Thống kê chi nhánh:
  - Số lượng lớp học
  - Số lượng học sinh
  - Số lượng giáo viên
- ⏳ Danh sách giáo viên thuộc chi nhánh
- ⏳ Lịch học của các lớp trong chi nhánh

---

## 📚 4. Quản Lý Lớp Học (Classes)

### 4.1. Danh Sách Lớp Học (ClassesPage)
**Route**: `/classes`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị danh sách lớp học dạng grid (theo design system)
- ✅ Tạo lớp học mới (modal với form validation)
- ✅ Sửa lớp học (modal)
- ✅ Xóa lớp học (confirmation dialog)
- ✅ Navigate đến chi tiết lớp học
- ✅ Loading state với spinner
- ✅ Empty state với icon và CTA
- ✅ Error handling với thông báo rõ ràng
- ✅ Responsive design (mobile-first)
- ✅ SVG icons (không dùng emoji)
- ✅ Hover effects và transitions mượt

**Cần cải thiện**:
- ✅ Tìm kiếm lớp học (theo tên lớp, chi nhánh, level)
- ✅ Lọc theo chi nhánh
- ✅ Lọc theo level
- ✅ Sắp xếp (theo tên lớp, chi nhánh, level, ngày tạo)
- ✅ Pagination (6, 12, 24, 48 items/trang)

### 4.2. Chi Tiết Lớp Học (ClassDetailPage)
**Route**: `/classes/:id`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị thông tin lớp học (theo design system)
- ✅ Sửa lớp học (modal với form validation)
- ✅ Xóa lớp học (confirmation dialog với variant danger)
- ✅ Danh sách học sinh thuộc lớp (grid layout)
- ✅ Danh sách buổi học của lớp:
  - Table view cho >= 10 buổi học
  - Grid view cho < 10 buổi học
  - Nút "Nhận xét" cho mỗi buổi học (điều hướng đến CommentsPage với classId và lessonId)
- ✅ Danh sách bài kiểm tra của lớp
- ✅ Navigate đến chi tiết học sinh/buổi học/bài kiểm tra
- ✅ Auto-refresh cache sau khi update/delete
- ✅ Loading states và error handling
- ✅ Responsive design
- ✅ SVG icons và hover effects

**Cần cải thiện**:
- ⏳ Quản lý giáo viên:
  - Thêm giáo viên vào lớp
  - Xóa giáo viên khỏi lớp
  - Hiển thị danh sách giáo viên của lớp
- ⏳ Quản lý học sinh:
  - Thêm học sinh vào lớp (từ trang chi tiết)
  - Xóa học sinh khỏi lớp (từ trang chi tiết)
- ⏳ Lịch học của lớp
- ⏳ Thống kê lớp học:
  - Điểm danh trung bình
  - Điểm số trung bình
  - Số buổi học đã có

---

## 👥 5. Quản Lý Học Sinh (Students)

### 5.1. Danh Sách Học Sinh (StudentsPage)
**Route**: `/students`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị danh sách học sinh dạng grid (theo design system)
- ✅ Lọc theo lớp học (dropdown)
- ✅ Tạo học sinh mới (modal với form validation)
- ✅ Sửa học sinh (modal)
- ✅ Xóa học sinh (confirmation dialog)
- ✅ Navigate đến chi tiết học sinh
- ✅ Loading state với spinner
- ✅ Empty state với icon và CTA
- ✅ Error handling với thông báo rõ ràng
- ✅ Responsive design (mobile-first)
- ✅ SVG icons (không dùng emoji)
- ✅ Hover effects và transitions mượt

**Cần cải thiện**:
- ✅ Tìm kiếm học sinh (theo tên, lớp, phụ huynh)
- ✅ Lọc theo chi nhánh (khi không chọn lớp cụ thể)
- ✅ Sắp xếp (theo tên, lớp học, ngày sinh, ngày tạo)
- ✅ Pagination (6, 12, 24, 48 items/trang)
- ⏳ Export danh sách học sinh ra Excel

### 5.2. Chi Tiết Học Sinh (StudentDetailPage)
**Route**: `/students/:id`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị thông tin học sinh (theo design system)
- ✅ Hiển thị thông tin phụ huynh
- ✅ Sửa học sinh (modal với form validation)
- ✅ Xóa học sinh (confirmation dialog với variant danger)
- ✅ Auto-refresh cache sau khi update/delete
- ✅ Loading states và error handling
- ✅ Responsive design
- ✅ SVG icons và hover effects

**Cần cải thiện**:
- ⏳ Lịch sử điểm danh
- ⏳ Lịch sử nhận xét
- ⏳ Lịch sử điểm số (từ các bài kiểm tra)
- ⏳ Biểu đồ tiến độ học tập
- ⏳ Chuyển lớp học sinh

---

## 👨‍🏫 6. Quản Lý Giáo Viên (Teachers)

### 6.1. Danh Sách Giáo Viên (TeachersPage)
**Route**: `/teachers`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị danh sách giáo viên dạng grid (theo design system)
- ✅ Tạo giáo viên mới (modal với form validation)
- ✅ Sửa giáo viên (modal)
- ✅ Xóa giáo viên (confirmation dialog)
- ✅ Navigate đến chi tiết giáo viên
- ✅ Loading state với spinner
- ✅ Empty state với icon và CTA
- ✅ Error handling với thông báo rõ ràng
- ✅ Responsive design (mobile-first)
- ✅ SVG icons (không dùng emoji)
- ✅ Hover effects và transitions mượt

**Cần cải thiện**:
- ✅ Tìm kiếm giáo viên (theo tên, email, chi nhánh, điện thoại)
- ✅ Lọc theo chi nhánh
- ✅ Sắp xếp (theo tên, chi nhánh, email, ngày tạo)
- ✅ Pagination (6, 12, 24, 48 items/trang)

### 6.2. Chi Tiết Giáo Viên (TeacherDetailPage)
**Route**: `/teachers/:id`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị thông tin giáo viên (theo design system)
- ✅ Hiển thị thông tin liên hệ (email, điện thoại)
- ✅ Sửa giáo viên (modal với form validation)
- ✅ Xóa giáo viên (confirmation dialog với variant danger)
- ✅ Auto-refresh cache sau khi update/delete
- ✅ Loading states và error handling
- ✅ Responsive design
- ✅ SVG icons và hover effects

**Cần cải thiện**:
- ⏳ Danh sách lớp học đang dạy
- ⏳ Lịch dạy học
- ⏳ Thống kê:
  - Số lớp đang dạy
  - Số học sinh
  - Số buổi học đã dạy

---

## 📖 7. Quản Lý Buổi Học (Lessons)

### 7.1. Danh Sách Buổi Học (LessonsPage)
**Route**: `/lessons`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị danh sách buổi học dạng grid (theo design system)
- ✅ Lọc theo lớp học (dropdown)
- ✅ Tạo buổi học mới (modal với form phức tạp)
- ✅ Sửa buổi học (modal)
- ✅ Xóa buổi học (confirmation dialog)
- ✅ Navigate đến chi tiết buổi học
- ✅ Xuất Excel
- ✅ Loading state với spinner
- ✅ Empty state với icon và CTA
- ✅ Error handling với thông báo rõ ràng
- ✅ Responsive design (mobile-first)
- ✅ SVG icons (không dùng emoji)
- ✅ Hover effects và transitions mượt

**Cần cải thiện**:
- ✅ Tìm kiếm buổi học (theo tên lớp, giáo viên, số buổi, tiêu đề)
- ✅ Sắp xếp (theo ngày, số buổi, tên lớp, giáo viên)
- ✅ Pagination (6, 12, 24, 48 items/trang)


### 7.2. Chi Tiết Buổi Học (LessonDetailPage)
**Route**: `/lessons/:id`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị thông tin buổi học (theo design system)
- ✅ Hiển thị Vocabulary (bảng với styling đẹp)
- ✅ Hiển thị Homework (danh sách với card design)
- ✅ Hiển thị nhận xét chung
- ✅ Nút "Nhận xét buổi học" (điều hướng đến CommentsPage với classId và lessonId)
- ✅ Sửa buổi học (modal với form phức tạp)
- ✅ Xóa buổi học (confirmation dialog với variant danger)
- ✅ Export Excel
- ✅ Auto-refresh cache sau khi update/delete
- ✅ Loading states và error handling
- ✅ Responsive design
- ✅ SVG icons và hover effects

**Cần cải thiện**:
- ⏳ Thêm/sửa/xóa Vocabulary items (inline editing)
- ⏳ Thêm/sửa/xóa Homework items (inline editing)
- ⏳ Sửa nhận xét chung (inline editing)

---

## 💬 8. Quản Lý Nhận Xét (Comments)

### 8.1. Danh Sách Nhận Xét (CommentsPage)
**Route**: `/comments`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Lọc theo lớp học (dropdown)
- ✅ Lọc theo buổi học (dropdown)
- ✅ Tự động chọn lớp học và buổi học từ URL params (`?classId=X&lessonId=Y`)
- ✅ Card hiển thị thông tin lớp học và buổi học:
  - Tên lớp học
  - Chi nhánh
  - Ngày học
  - Số buổi học
  - Giáo viên
- ✅ Hiển thị danh sách nhận xét dạng table (desktop) và cards (mobile)
- ✅ Inline editing (nhập trực tiếp trong table/cards):
  - Điểm Vocabulary (0-10, input number)
  - Điểm School Exam (0-10, input number)
  - Trạng thái Homework (dropdown: Hoàn thành/Chưa hoàn thành/Không nộp)
  - Nhận xét (textarea)
- ✅ Tự động tạo nhận xét mới hoặc cập nhật nhận xét hiện có (upsert)
- ✅ Xóa nhận xét (confirmation dialog với variant danger)
- ✅ Export Excel
- ✅ Nút nhận xét trong danh sách buổi học (ClassDetailPage)
- ✅ Nút nhận xét trong chi tiết buổi học (LessonDetailPage)
- ✅ Loading state với spinner
- ✅ Empty state với icon và CTA
- ✅ Error handling với thông báo rõ ràng
- ✅ Responsive design (mobile-first):
  - Layout tối ưu cho mobile: 3 cột cho điểm số và BTVN, nhận xét full width
  - Touch-friendly buttons (min-height 44px)
- ✅ SVG icons (không dùng emoji)
- ✅ Hover effects và transitions mượt

**Cần cải thiện**:
- ✅ Tìm kiếm nhận xét (theo tên học sinh, nội dung nhận xét)
- ✅ Lọc theo học sinh
- ✅ Lọc theo giáo viên
- ✅ Lọc theo ngày (từ ngày - đến ngày)
- ✅ Sắp xếp (theo tên học sinh, điểm Vocabulary, điểm trên lớp, ngày tạo)
- ✅ Pagination (5, 10, 20, 50 items/trang)
- ✅ Bulk actions (xóa nhiều nhận xét)

---

## 📝 9. Quản Lý Bài Kiểm Tra (Exams)

### 9.1. Danh Sách Bài Kiểm Tra (ExamsPage)
**Route**: `/exams`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị danh sách bài kiểm tra dạng grid (theo design system)
- ✅ Lọc theo lớp học (dropdown)
- ✅ Tạo bài kiểm tra mới (modal với form validation):
  - Chọn lớp học (dropdown)
  - Chọn giáo viên (dropdown, tự động lọc theo chi nhánh của lớp)
  - Ngày kiểm tra (DatePicker)
  - Loại bài kiểm tra (dropdown: Giữa kỳ, Cuối kỳ, Kiểm tra thường xuyên, Kiểm tra định kỳ, Thi thử)
- ✅ Sửa bài kiểm tra (modal với form validation)
- ✅ Xóa bài kiểm tra (confirmation dialog với variant danger)
- ✅ Navigate đến chi tiết bài kiểm tra
- ✅ Xuất Excel
- ✅ Loading state với spinner
- ✅ Empty state với icon và CTA
- ✅ Error handling với thông báo rõ ràng
- ✅ Responsive design (mobile-first)
- ✅ SVG icons (không dùng emoji)
- ✅ Hover effects và transitions mượt

**Cần cải thiện**:
- ✅ Tìm kiếm bài kiểm tra (theo tên lớp, loại bài, giáo viên)
- ✅ Lọc theo giáo viên
- ✅ Lọc theo loại bài kiểm tra
- ✅ Lọc theo ngày (từ ngày - đến ngày)
- ✅ Sắp xếp (theo ngày, tên lớp, loại bài, giáo viên)
- ✅ Pagination (6, 12, 24, 48 items/trang)
- ✅ Bulk actions (xóa nhiều bài kiểm tra)

### 9.2. Chi Tiết Bài Kiểm Tra (ExamDetailPage)
**Route**: `/exams/:id`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị thông tin bài kiểm tra (theo design system)
- ✅ Hiển thị danh sách kết quả (table với styling đẹp cho desktop, cards cho mobile)
- ✅ Inline editing (nhập trực tiếp trong table/cards):
  - Speaking Score (0-10, số thập phân, input number)
  - Listening Score (0-10, số thập phân, input number)
  - Reading & Writing Score (0-10, số thập phân, input number)
  - Comment (textarea)
- ✅ Tự động tạo kết quả mới hoặc cập nhật kết quả hiện có (upsert)
- ✅ Xóa kết quả học sinh (confirmation dialog với variant danger)
- ✅ Export Excel với đầy đủ điểm số
- ✅ Sửa thông tin bài kiểm tra (modal với form validation)
- ✅ Xóa bài kiểm tra (confirmation dialog với variant danger)
- ✅ Thống kê:
  - Điểm trung bình Speaking (tự động tính)
  - Điểm trung bình Listening (tự động tính)
  - Điểm trung bình Reading & Writing (tự động tính)
- ✅ Auto-refresh cache sau khi update/delete
- ✅ Loading states và error handling
- ✅ Responsive design (mobile-first):
  - Layout tối ưu cho mobile: 3 cột cho Speaking/Listening/Reading & Writing, nhận xét full width
  - Touch-friendly buttons (min-height 44px)
- ✅ SVG icons và hover effects

**Cần cải thiện**:
- ⏳ Điểm trung bình tổng
- ⏳ Biểu đồ phân bố điểm

---

## ✅ 10. Quản Lý Điểm Danh (Attendance)

### 10.1. Danh Sách Điểm Danh (AttendancePage)
**Route**: `/attendance`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị danh sách điểm danh:
  - Lọc theo lớp học
  - Lọc theo buổi học
  - Lọc theo ngày (từ ngày - đến ngày)
  - Lọc theo trạng thái (Present/Absent/Late)
- ✅ Xóa điểm danh (confirmation dialog)
- ✅ Bulk delete (xóa nhiều điểm danh)
- ✅ Tìm kiếm điểm danh (theo tên học sinh, lớp học, ghi chú)
- ✅ Sắp xếp (theo ngày học, tên học sinh, trạng thái, ngày tạo)
- ✅ Pagination (6, 12, 24, 48 items/trang)
- ✅ Responsive design (mobile-first):
  - Table view cho desktop
  - Cards view cho mobile
  - Collapsible advanced search toolbar trên mobile
- ✅ SVG icons và hover effects
- ✅ Loading states và error handling

**Cần cải thiện**:
- ⏳ Tạo điểm danh mới (form) - có thể dùng QuickAttendancePage
- ⏳ Sửa điểm danh (form) - có thể dùng QuickAttendancePage
- ⏳ Export Excel
- ⏳ Thống kê điểm danh:
  - Tỷ lệ có mặt
  - Tỷ lệ vắng mặt
  - Tỷ lệ đi muộn
  - Biểu đồ điểm danh theo tháng

### 10.2. Điểm Danh Nhanh (QuickAttendancePage)
**Route**: `/attendance/quick`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Chọn lớp học (dropdown)
- ✅ Chọn buổi học (dropdown, tự động lọc theo lớp)
- ✅ Hiển thị thông tin lớp học và buổi học
- ✅ Danh sách học sinh với buttons:
  - Present (có mặt) - màu xanh
  - Absent (vắng mặt) - màu đỏ
  - Late (đi muộn) - màu vàng
- ✅ Ghi chú cho mỗi học sinh (tùy chọn)
- ✅ Lưu điểm danh hàng loạt (bulk save)
- ✅ Tự động load điểm danh hiện có (nếu đã có)
- ✅ Mobile-friendly (tối ưu cho tablet/điện thoại):
  - Touch-friendly buttons (min-height 44px)
  - Responsive layout
  - Compact spacing
- ✅ Loading states và error handling
- ✅ SVG icons và visual feedback

---

## 📅 11. Quản Lý Lịch Học (Schedules)

### 11.1. Danh Sách Lịch Học (SchedulesPage)
**Route**: `/schedules`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Hiển thị lịch học dạng table/list:
  - Table view cho desktop
  - Cards view cho mobile
- ✅ Lọc theo lớp học
- ✅ Lọc theo ngày trong tuần
- ✅ Tạo lịch học mới (modal/form):
  - Chọn lớp học (dropdown)
  - Ngày trong tuần (dropdown: Chủ nhật - Thứ bảy)
  - Giờ bắt đầu (time input)
  - Giờ kết thúc (time input)
  - Phòng học (tùy chọn, text input)
- ✅ Sửa lịch học (modal/form)
- ✅ Xóa lịch học (confirmation dialog)
- ✅ Tìm kiếm lịch học (theo tên lớp học, phòng học)
- ✅ Sắp xếp (theo ngày trong tuần, tên lớp học, giờ bắt đầu)
- ✅ Pagination (6, 12, 24, 48 items/trang)
- ✅ Responsive design (mobile-first):
  - Collapsible advanced search toolbar trên mobile
  - Touch-friendly buttons
- ✅ SVG icons và hover effects
- ✅ Loading states và error handling
- ✅ Navigate đến chi tiết lớp học khi click vào lịch học

**Cần cải thiện**:
- ⏳ Hiển thị lịch học dạng calendar view:
  - Tuần view
  - Tháng view
- ⏳ Lọc theo giáo viên (thông qua lớp học)
- ⏳ Export lịch học ra Excel

### 11.2. Calendar View (CalendarPage)
**Route**: `/schedules/calendar`  
**Trạng thái**: ❌ Chưa có

**Chức năng cần phát triển**:
- ❌ Calendar component hiển thị lịch học:
  - Tuần view
  - Tháng view
  - Ngày view
- ❌ Click vào slot để xem chi tiết lớp học
- ❌ Drag & drop để thay đổi lịch học
- ❌ Filter theo chi nhánh
- ❌ Filter theo giáo viên
- ❌ Filter theo lớp học
- ❌ Mobile-friendly

---

## 🔗 12. Chia Sẻ Link (Shared Links)

### 12.1. Quản Lý Link Chia Sẻ (SharedLinksPage)
**Route**: `/shared-links`  
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Danh sách các link đã tạo:
  - Link URL
  - Loại (Lesson/Exam)
  - Ngày tạo
  - Ngày hết hạn
  - Trạng thái (Active/Expired) với badge màu
- ✅ Tạo link chia sẻ mới (modal):
  - Chọn loại (Buổi học/Bài kiểm tra)
  - Chọn item cụ thể (dropdown)
  - Thời gian hết hạn (DatePicker, tùy chọn)
  - Generate token và QR code tự động
  - Hiển thị QR code và link sau khi tạo
- ✅ Xem QR code (modal riêng hoặc trong modal tạo)
- ✅ Copy link (với feedback "Đã copy!")
- ✅ Xóa link (confirmation dialog)
- ✅ Tìm kiếm link (theo URL, token)
- ✅ Lọc theo loại (Lesson/Exam)
- ✅ Lọc theo trạng thái (Active/Expired)
- ✅ Sắp xếp (theo ngày tạo, ngày hết hạn, loại)
- ✅ Pagination (6, 12, 24, 48 items/trang)
- ✅ Responsive design (mobile-first):
  - Table view cho desktop
  - Cards view cho mobile
  - Collapsible advanced search toolbar trên mobile
- ✅ SVG icons và hover effects
- ✅ Loading states và error handling

**Cần cải thiện**:
- ⏳ Chia sẻ Nhận xét (Comment) - backend hiện chỉ support Lesson và Exam

### 12.2. Xem Link Chia Sẻ (Public) (SharedLinkViewPage)
**Route**: `/shared/:token`  
**Trạng thái**: ✅ Đã hoàn thành  
**Public**: Không cần đăng nhập

**Chức năng**:
- ✅ Kiểm tra token hợp lệ
- ✅ Kiểm tra token chưa hết hạn
- ✅ Hiển thị nội dung được chia sẻ:
  - Nếu là Buổi học: Hiển thị như LessonDetailPage (read-only):
    - Thông tin buổi học (lớp, số buổi, ngày, giáo viên)
    - Bảng từ vựng
    - Danh sách bài tập về nhà
    - Nhận xét chung
  - Nếu là Bài kiểm tra: Hiển thị kết quả bài kiểm tra (read-only):
    - Thông tin bài kiểm tra (lớp, loại bài, ngày, giáo viên)
    - Bảng kết quả với điểm số và nhận xét
- ✅ Print view (nút "In trang")
- ✅ Responsive design
- ✅ Error handling (token không hợp lệ, đã hết hạn) với thông báo rõ ràng
- ✅ Loading states

**Cần cải thiện**:
- ⏳ Export PDF (nếu cần)

---

## 👤 13. Quản Lý Tài Khoản (Profile & Settings)

### 13.1. Thông Tin Cá Nhân (ProfilePage)
**Route**: `/profile`  
**Trạng thái**: ❌ Chưa có

**Chức năng cần phát triển**:
- ❌ Hiển thị thông tin tài khoản:
  - Username
  - Email
  - Role
  - Chi nhánh (nếu có)
- ❌ Sửa thông tin cá nhân (form)
- ❌ Đổi mật khẩu (form)
- ❌ Upload avatar (nếu cần)

### 13.2. Cài Đặt (SettingsPage)
**Route**: `/settings`  
**Trạng thái**: ❌ Chưa có

**Chức năng cần phát triển**:
- ❌ Cài đặt hệ thống:
  - Ngôn ngữ
  - Theme (Light/Dark)
  - Timezone
- ❌ Cài đặt thông báo
- ❌ Cài đặt xuất file (format, template)

---

## 📊 14. Báo Cáo và Thống Kê (Reports)

### 14.1. Báo Cáo Tổng Quan (ReportsPage)
**Route**: `/reports`  
**Trạng thái**: ❌ Chưa có

**Chức năng cần phát triển**:
- ❌ Dashboard thống kê:
  - Tổng số học sinh theo tháng
  - Tỷ lệ điểm danh
  - Điểm số trung bình
  - Số lượng lớp học
- ❌ Biểu đồ:
  - Line chart: Tiến độ học tập
  - Bar chart: So sánh điểm số
  - Pie chart: Phân bố học sinh theo lớp
- ❌ Export báo cáo ra Excel/PDF
- ❌ Filter theo:
  - Chi nhánh
  - Lớp học
  - Khoảng thời gian

### 14.2. Báo Cáo Học Sinh (StudentReportPage)
**Route**: `/reports/students`  
**Trạng thái**: ❌ Chưa có

**Chức năng cần phát triển**:
- ❌ Báo cáo chi tiết học sinh:
  - Lịch sử điểm danh
  - Lịch sử điểm số
  - Lịch sử nhận xét
  - Biểu đồ tiến độ
- ❌ Export báo cáo học sinh ra Excel/PDF

---

## 🔍 15. Tìm Kiếm Toàn Cục (Global Search)

### 15.1. Tìm Kiếm (SearchPage)
**Route**: `/search`  
**Trạng thái**: ❌ Chưa có

**Chức năng cần phát triển**:
- ❌ Search bar trong header
- ❌ Tìm kiếm:
  - Học sinh
  - Giáo viên
  - Lớp học
  - Buổi học
  - Bài kiểm tra
- ❌ Kết quả tìm kiếm với phân loại
- ❌ Quick actions từ kết quả tìm kiếm
- ❌ Search history (nếu cần)

---

## 📱 16. Mobile-Specific Features

### 16.1. Bottom Navigation
**Trạng thái**: ✅ Đã hoàn thành

**Chức năng**:
- ✅ Navigation bar ở bottom cho mobile
- ✅ 5 mục chính: Dashboard, Lớp học, Buổi học, Nhận xét, Bài kiểm tra
- ✅ Active state
- ✅ Safe area cho iOS

### 16.2. Mobile Optimizations
**Trạng thái**: ⏳ Đang cải thiện

**Cần cải thiện**:
- ⏳ Swipe gestures
- ⏳ Pull to refresh
- ⏳ Infinite scroll
- ⏳ Touch-optimized forms
- ⏳ Offline support (nếu cần)

---

## 🎨 17. Components Cần Phát Triển

### 17.1. Common Components
**Trạng thái**: ⏳ Đang phát triển

**Đã có**:
- ✅ Button
- ✅ Input
- ✅ Card
- ✅ Modal
- ✅ ConfirmDialog

**Cần thêm**:
- ❌ Select/Dropdown
- ❌ DatePicker
- ❌ TimePicker
- ❌ Table (với sorting, filtering, pagination)
- ❌ Calendar
- ❌ Charts (Line, Bar, Pie)
- ❌ Toast/Notification
- ❌ Loading Spinner
- ❌ Empty State
- ❌ Error Boundary
- ❌ Tooltip
- ❌ Popover
- ❌ Tabs
- ❌ Accordion
- ❌ Badge
- ❌ Avatar
- ❌ Progress Bar

### 17.2. Form Components
**Trạng thái**: ❌ Chưa có

**Cần phát triển**:
- ❌ Form wrapper với validation
- ❌ Textarea
- ❌ Checkbox
- ❌ Radio
- ❌ Switch/Toggle
- ❌ File Upload
- ❌ Multi-select
- ❌ Autocomplete

---

## 🔐 18. Phân Quyền và Bảo Mật

### 18.1. Role-Based Access Control
**Trạng thái**: ⏳ Cần cải thiện

**Roles**:
- Owner (Chủ trung tâm)
- BranchManager (Quản lý chi nhánh)
- Teacher (Giáo viên)
- Parent (Phụ huynh)

**Cần implement**:
- ❌ Route protection theo role
- ❌ Component-level permissions
- ❌ API call permissions
- ❌ UI elements hiển thị theo role

---

## 📤 19. Export & Import

### 19.1. Export Features
**Trạng thái**: ⏳ Một phần

**Đã có**:
- ✅ Export buổi học ra Excel
- ✅ Export nhận xét ra Excel
- ✅ Export bài kiểm tra ra Excel

**Cần thêm**:
- ❌ Export danh sách học sinh
- ❌ Export danh sách giáo viên
- ❌ Export danh sách lớp học
- ❌ Export lịch học
- ❌ Export báo cáo
- ❌ Export PDF (nếu cần)

### 19.2. Import Features
**Trạng thái**: ❌ Chưa có

**Cần phát triển**:
- ❌ Import danh sách học sinh từ Excel
- ❌ Import danh sách giáo viên từ Excel
- ❌ Import điểm danh từ Excel
- ❌ Import điểm số từ Excel
- ❌ Template download
- ❌ Validation và error handling

---

## 🔔 20. Thông Báo (Notifications)

### 20.1. Notification System
**Trạng thái**: ❌ Chưa có

**Cần phát triển**:
- ❌ Notification bell trong header
- ❌ Danh sách thông báo
- ❌ Đánh dấu đã đọc
- ❌ Xóa thông báo
- ❌ Real-time notifications (nếu cần)
- ❌ Email notifications (nếu cần)

---

## 📝 21. Ghi Chú và Checklist

### 21.1. Notes/Todos
**Trạng thái**: ❌ Chưa có (Optional)

**Có thể thêm**:
- ❌ Ghi chú cho học sinh
- ❌ Ghi chú cho lớp học
- ❌ Checklist cho giáo viên
- ❌ Reminders

---

## 🎯 Tổng Kết

### Thống Kê Tiến Độ

| Loại | Đã Hoàn Thành | Đang Phát Triển | Chưa Bắt Đầu | Tổng |
|------|---------------|-----------------|--------------|------|
| Màn hình chính | 14 | 0 | 6 | 20 |
| Components | 13 | 0 | 15+ | 20+ |
| Tính năng | 50+ | 1+ | 50+ | 75+ |

### Ưu Tiên Phát Triển

**Phase 1 - Core Features (Ưu tiên cao)**:
1. ✅ Quản lý Chi nhánh (CRUD đầy đủ - đã hoàn thành)
2. ✅ Quản lý Lớp học (CRUD đầy đủ - đã hoàn thành)
3. ✅ Quản lý Học sinh (CRUD đầy đủ - đã hoàn thành)
4. ✅ Quản lý Giáo viên (CRUD đầy đủ - đã hoàn thành)
5. ✅ Quản lý Buổi học (CRUD đầy đủ - đã hoàn thành)
6. ✅ Quản lý Nhận xét (CRUD đầy đủ - đã hoàn thành)
7. ✅ Quản lý Bài kiểm tra (CRUD đầy đủ - đã hoàn thành) 🎉

**Phase 2 - Advanced Features (Ưu tiên trung bình)**:
1. ✅ Quản lý Điểm danh (đã hoàn thành AttendancePage và QuickAttendancePage)
2. ✅ Quản lý Lịch học (đã hoàn thành SchedulesPage với table/list view)
3. ✅ Chia sẻ Link (đã hoàn thành SharedLinksPage và SharedLinkViewPage)
4. ❌ Dashboard với thống kê
5. ❌ Báo cáo và Export

**Phase 3 - Enhancements (Ưu tiên thấp)**:
1. ❌ Tìm kiếm toàn cục
2. ❌ Thông báo
3. ❌ Import dữ liệu
4. ❌ Mobile optimizations nâng cao

---

## 📌 Lưu Ý

- Tất cả các màn hình cần tuân thủ Design System tại `design-system/qldt---quản-lý-trung-tâm-tiếng-anh/MASTER.md`
- Responsive design cho mobile (375px+)
- Error handling và loading states cho tất cả API calls
- Form validation đầy đủ
- Accessibility (a11y) compliance
- Performance optimization

---

**Cập nhật lần cuối**: 2025-01-19

### Cải Thiện Gần Đây

**Tìm kiếm và Filter nâng cao (2025-01-19)**:
- ✅ **BranchesPage**: Tìm kiếm, sắp xếp, pagination với collapse trên mobile
- ✅ **ClassesPage**: Tìm kiếm, filter theo chi nhánh/level, sắp xếp, pagination với collapse trên mobile
- ✅ **StudentsPage**: Tìm kiếm, filter theo chi nhánh, sắp xếp, pagination với collapse trên mobile
- ✅ **TeachersPage**: Tìm kiếm, filter theo chi nhánh, sắp xếp, pagination với collapse trên mobile
- ✅ **ExamsPage**: Tìm kiếm, filter theo giáo viên/loại bài/ngày, sắp xếp, pagination, bulk actions với collapse trên mobile
- ✅ **LessonsPage**: Tìm kiếm, sắp xếp, pagination với collapse trên mobile
- ✅ **CommentsPage**: Tìm kiếm, filter theo học sinh/giáo viên/ngày, sắp xếp, pagination, bulk actions với collapse trên mobile

**Mobile UX Improvements**:
- ✅ Tất cả các trang có toolbar "Tìm kiếm nâng cao" có thể collapse trên mobile
- ✅ Toolbar luôn hiển thị trên desktop, ẩn mặc định trên mobile
- ✅ Consistent pattern và UI/UX across all pages

**CommentsPage (Nhận xét hàng ngày)**:
- ✅ Thêm card hiển thị thông tin lớp học và buổi học
- ✅ Chuyển từ modal sang inline editing cho nhập điểm và nhận xét
- ✅ Tối ưu UI mobile: layout 3 cột cho điểm số, nhận xét full width
- ✅ Tự động chọn lớp học và buổi học từ URL params
- ✅ Thêm nút nhận xét trong danh sách buổi học (ClassDetailPage)
- ✅ Thêm nút nhận xét trong chi tiết buổi học (LessonDetailPage)

**ExamDetailPage (Chi tiết bài kiểm tra)**:
- ✅ Chuyển từ modal sang inline editing cho nhập điểm
- ✅ Tối ưu UI mobile: layout 3 cột cho Speaking/Listening/Reading & Writing, nhận xét full width

**Mobile Optimizations**:
- ✅ Touch-friendly buttons (min-height 44px)
- ✅ Responsive grid layouts cho forms
- ✅ Compact spacing và padding cho mobile

**Quản lý Điểm danh (2025-01-19)**:
- ✅ **AttendancePage**: Danh sách điểm danh với filter theo lớp học/buổi học/ngày/trạng thái, tìm kiếm, sắp xếp, pagination, bulk delete, responsive design với collapse trên mobile
- ✅ **QuickAttendancePage**: Điểm danh nhanh cho giáo viên với chọn lớp học/buổi học, buttons cho Present/Absent/Late, ghi chú, bulk save, mobile-friendly
- ✅ Thêm "Điểm danh" vào Sidebar và BottomNav
- ✅ Thêm nút "Điểm danh nhanh" vào danh sách buổi học trong ClassDetailPage

**Quản lý Lịch học (2025-01-19)**:
- ✅ **Backend API**: Thêm endpoint GET /api/schedules để lấy tất cả lịch học
- ✅ **ScheduleFormModal**: Modal tạo/sửa lịch học với validation đầy đủ
- ✅ **SchedulesPage**: Danh sách lịch học với filter theo lớp học/ngày trong tuần, tìm kiếm, sắp xếp, pagination, CRUD operations, responsive design với collapse trên mobile
- ✅ Thêm "Lịch học" vào Sidebar

**Chia sẻ Link (2025-01-19)**:
- ✅ **Backend API**: Thêm endpoint GET /api/sharedlinks để lấy tất cả shared links của user hiện tại
- ✅ **CreateSharedLinkModal**: Modal tạo link chia sẻ với chọn loại (Lesson/Exam), chọn item, ngày hết hạn, hiển thị QR code và link sau khi tạo
- ✅ **SharedLinksPage**: Danh sách link chia sẻ với filter theo loại/trạng thái, tìm kiếm, sắp xếp, pagination, copy link, xem QR code, xóa link, responsive design với collapse trên mobile
- ✅ **SharedLinkViewPage**: Trang public xem nội dung được chia sẻ (không cần đăng nhập), hiển thị buổi học hoặc bài kiểm tra (read-only), error handling cho token không hợp lệ/hết hạn, print view
- ✅ Thêm route `/shared/:token` (public) và `/shared-links` vào App.tsx
