# Áp dụng bản cập nhật v0.7.0

Bản nền bắt buộc: `v0.6.0` (Phần 6).

## 1. Dừng server

Nhấn `Ctrl + C` trong terminal đang chạy `npm run dev`.

## 2. Giải nén gói cập nhật ra một thư mục riêng

Không giải nén đè thủ công vào project. Mở PowerShell trong thư mục `FootballBookingSystem_Part07_Update` vừa giải nén.

## 3. Chạy updater

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\apply-update.ps1 -ProjectPath "D:\FootballBookingSystem"
```

Updater sẽ kiểm tra `VERSION = 0.6.0`, checksum payload và tạo backup trước khi ghi đè.

## 4. Kiểm tra

Không cần `npm install`, không cần migration SQL.

```powershell
cd D:\FootballBookingSystem
npm run verify
npm test
npm run dev
```

Kết quả mong đợi: version `0.7.0`, 25 unit test pass.
