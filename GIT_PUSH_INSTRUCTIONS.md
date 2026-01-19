# Hướng dẫn đẩy dự án lên GitHub

## Bước 1: Xóa lock file (nếu có)
```powershell
Remove-Item -Path ".git/index.lock" -Force -ErrorAction SilentlyContinue
```

## Bước 2: Kiểm tra .gitignore đã được cập nhật
File `.gitignore` đã được cập nhật để ignore:
- `**/node_modules/` - Tất cả node_modules ở mọi nơi
- `*.db`, `*.db-shm`, `*.db-wal` - Database files
- Các file build và cache khác

## Bước 3: Add các file cần thiết
```powershell
git add .
```

## Bước 4: Kiểm tra các file sẽ được commit
```powershell
git status
```

Đảm bảo KHÔNG có:
- `node_modules/`
- `*.db` files
- `bin/`, `obj/` folders
- `dist/` folders

## Bước 5: Commit
```powershell
git commit -m "Initial commit: QLDT - Hệ thống quản lý trung tâm tiếng Anh"
```

## Bước 6: Thêm remote repository
```powershell
git remote add origin https://github.com/datngo68/qldt.git
```

## Bước 7: Push lên GitHub
```powershell
git branch -M main
git push -u origin main
```

## Lưu ý
- Nếu gặp lỗi lock file, đóng tất cả terminal/IDE và thử lại
- Nếu repository trên GitHub đã có nội dung, có thể cần `git pull` trước khi push
- Nếu cần force push (cẩn thận!): `git push -u origin main --force`
