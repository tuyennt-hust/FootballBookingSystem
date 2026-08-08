# Cách áp dụng bản cập nhật Phần 4

1. Dừng server bằng `Ctrl + C`.
2. Giải nén gói cập nhật.
3. Sao chép toàn bộ file và thư mục bên trong gói vào thư mục project hiện tại `D:\FootballBookingSystem`.
4. Chọn **Replace the files in the destination** khi Windows hỏi ghi đè.
5. Không xóa `.env`, `node_modules` hoặc database hiện tại.
6. Không cần chạy `npm install` và không cần chạy lại file SQL.
7. Chạy lại:

```powershell
npm run dev
```

8. Kiểm tra:

```text
http://localhost:3000/san-bong/S01
http://localhost:3000/api/pitches/S01/availability
```
