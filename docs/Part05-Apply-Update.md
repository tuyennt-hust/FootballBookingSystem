# Áp dụng gói cập nhật Phần 5

Gói `FootballBookingSystem_Part05_Update.zip` chỉ chứa các file thay đổi từ Phần 4 sang Phần 5. Gói không chứa `.env`, `node_modules` hoặc database.

## Cách khuyến nghị bằng PowerShell

1. Dừng server bằng `Ctrl + C`.
2. Đặt file ZIP tại `D:\` hoặc chỉnh đường dẫn trong lệnh.
3. Chạy:

```powershell
Expand-Archive -Path "D:\FootballBookingSystem_Part05_Update.zip" `
  -DestinationPath "D:\FootballBookingSystem" `
  -Force
```

4. Không cần chạy lại SQL và không cần `npm install`.
5. Chạy:

```powershell
cd D:\FootballBookingSystem
npm test
npm run dev
```

## Nếu đã giải nén thành thư mục con

Ví dụ:

```text
D:\FootballBookingSystem\FootballBookingSystem_Part05_Update\
```

Chạy tại `D:\FootballBookingSystem`:

```powershell
Get-ChildItem -Force ".\FootballBookingSystem_Part05_Update" |
  Copy-Item -Destination "." -Recurse -Force

Remove-Item ".\FootballBookingSystem_Part05_Update" -Recurse -Force
```
