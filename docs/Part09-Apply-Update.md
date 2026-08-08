# Áp dụng cập nhật v0.8.0 -> v0.9.0

## Điều kiện

Project hiện tại phải là bản `0.8.0` đã kiểm thử.

Kiểm tra:

```powershell
Get-Content D:\FootballBookingSystem\VERSION
```

Kết quả phải là:

```text
0.8.0
```

## 1. Dừng server

Trong terminal `npm run dev`, nhấn `Ctrl + C`.

## 2. Giải nén gói update ra thư mục riêng

Ví dụ:

```text
D:\FootballBookingSystem_Part09_Update
```

Không giải nén trực tiếp đè vào project.

## 3. Chạy updater

```powershell
cd D:\FootballBookingSystem_Part09_Update
Set-ExecutionPolicy -Scope Process Bypass
.\apply-update.ps1 -ProjectPath "D:\FootballBookingSystem"
```

Updater sẽ:

1. kiểm tra `VERSION=0.8.0`;
2. kiểm tra SHA-256 của các file nền cần sửa;
3. kiểm tra checksum payload;
4. tạo backup;
5. chép patch;
6. chạy `verify` và `audit` tự động;
7. rollback nếu bước copy/verify/audit thất bại.

## 4. Không cần npm install và không cần SQL migration

Dependency và schema không thay đổi ở Phần 9.

## 5. Chạy kiểm tra đầy đủ

```powershell
cd D:\FootballBookingSystem
npm run check
npm run db:check
```

Sau đó:

```powershell
npm run dev
```

Mở:

```text
http://localhost:3000/api/health
```

`version` phải là `0.9.0`.

## 6. Kiểm tra nhanh trình duyệt

- Trang chủ và danh sách sân vẫn hoạt động.
- Đăng nhập khách/chủ sân/Admin.
- Thử một form có xác nhận như hủy đơn hoặc xác nhận đơn; hộp thoại xác nhận vẫn hiện.
- Bấm Tab ở đầu trang; skip-link `Bỏ qua điều hướng` xuất hiện.
- DevTools -> Network -> response headers có `Content-Security-Policy` và `X-Frame-Options: DENY`.

## 7. Database final smoke

`npm run db:check` phải kết thúc bằng:

```text
[DB CHECK] Tất cả kiểm tra database đạt.
```

Nếu lỗi, không xóa database. Gửi nguyên output để xác định bất biến nào bị vi phạm.
