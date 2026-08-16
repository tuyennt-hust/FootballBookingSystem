# UI/UX v1.0

## Hướng thiết kế

Giao diện theo hướng sports-tech hiện đại: xanh sân cỏ làm màu thương hiệu, nền sáng, card có chiều sâu vừa phải, typography rõ ràng và CTA nổi bật. Lớp polish nằm trong `public/css/ui-v1.css`, được load sau `main.css` để giảm rủi ro ảnh hưởng business logic.

## Nguyên tắc

- Một màn hình có một hành động chính rõ ràng.
- Trạng thái booking/thanh toán/sân luôn dùng badge nhất quán.
- Desktop ưu tiên mật độ thông tin; mobile ưu tiên thao tác một cột.
- Các màn hình quản trị dùng cùng hệ thống card, table, filter và spacing.
- Nội dung trên UI tập trung vào người dùng, không mô tả chi tiết PostgreSQL/trigger/repository.

## Ảnh sân nên chuẩn bị

Để bản portfolio nhìn như sản phẩm thật, nên có khoảng 6–10 ảnh sân thật hoặc ảnh stock hợp pháp để thay SVG mặc định.

- Tỷ lệ: 16:10 hoặc 16:9.
- Khuyến nghị: 1200 × 750 px hoặc lớn hơn.
- Định dạng: WebP/JPG/PNG.
- Dung lượng: dưới 1 MB nếu có thể; hệ thống cho phép tối đa 5 MB.
- Ảnh đủ sáng, không watermark lớn, không chèn chữ lên ảnh.
- Mỗi sân dùng ảnh có góc chụp khác nhau để danh sách tự nhiên hơn.

Ảnh có thể upload trực tiếp từ trang quản lý sân của chủ sân, không cần sửa code.

## Kiểm tra responsive

Nên kiểm tra tối thiểu ở các chiều rộng: 1440 px, 1024 px, 768 px và 390 px. Luồng cần kiểm tra gồm trang chủ, tìm sân, chi tiết sân, đăng nhập, lịch sử booking, hóa đơn, dashboard chủ sân và dashboard admin.


## Lần tinh chỉnh tiếp theo (v1.0.1)
- Thay visual bên phải trang đăng nhập bằng ảnh sân vận động thực tế.
- Xóa khối tài khoản trải nghiệm khỏi giao diện để bản portfolio gọn hơn.
- Tinh chỉnh lại khoảng cách, tỷ lệ và typography của hai trang xác thực.


## v1.0.2 - Dashboard polish
- Chuẩn hóa card KPI, badge trạng thái, bảng dữ liệu và action card.
- Nâng dashboard Chủ sân, Admin và trang hồ sơ tài khoản.
- Loại bỏ nội dung phụ không cần thiết ở form đăng ký.


## v1.0.3 – Render polish
- Chuẩn hóa fallback artwork của sân, badge trạng thái và dashboard spacing.
- Thanh điều hướng quản trị được tách thành sticky sub-navigation.
- Điều chỉnh overflow doanh thu và responsive cho màn hình nhỏ.
