# Áp dụng cập nhật Phần 8

Base: `v0.7.0` → Target: `v0.8.0`.

1. Dừng server bằng `Ctrl + C`.
2. Giải nén `FootballBookingSystem_Part08_Update.zip` ra thư mục riêng.
3. Chạy:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\apply-update.ps1 -ProjectPath "D:\FootballBookingSystem"
```

4. Không cần `npm install`, không cần chạy SQL.
5. Chạy:

```powershell
cd D:\FootballBookingSystem
npm run verify
npm test
npm run dev
```

6. Đăng nhập `admin / 123456`, mở `/admin`.
