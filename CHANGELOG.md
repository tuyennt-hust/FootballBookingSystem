# Changelog

## 0.9.0 - Phần 9: Finalization

- Audit toàn bộ kiến trúc và hoàn thiện module customer còn ở dạng khung.
- Thêm security headers, CSP, body limit, no-store cho dữ liệu nhạy cảm và tắt `X-Powered-By`.
- Loại bỏ inline JavaScript khỏi EJS để CSP chặt hơn.
- Thêm skip-link, focus và reduced-motion accessibility.
- Production bắt buộc session secret mạnh và DB password không rỗng.
- Thêm `/api/auth/csrf` và `/api/customers/summary`.
- Thêm `npm run audit`, `npm run check`, `npm run db:check`.
- Bổ sung unit tests authentication, pitch, security và customer guard.
- Thêm final database smoke test.
- Hoàn thiện API, Database, User Guide, Deployment, Test Plan và Security docs.
- Tạo ERD, Use Case, Architecture và Sequence Booking từ thiết kế cuối.
- Không thêm dependency npm và không cần migration database.

## 0.8.0 - Phần 8: Quản trị viên

- Dashboard quản trị, quản lý tài khoản/khu vực.
- Theo dõi sân, đơn, hóa đơn và báo cáo thống kê.
- Thu hồi session khi khóa tài khoản.

## 0.7.0 - Phần 7: Dịch vụ và thanh toán

- Sửa validation giá thuê để giá tròn như 200000 hợp lệ.
- Thêm dịch vụ, hóa đơn và thanh toán mô phỏng.

## 0.6.0 - Phần 6: Quản lý chủ sân

- Dashboard chủ sân, CRUD sân, upload ảnh, trạng thái sân, xác nhận booking.
- Migration `001_add_pitch_image_url.sql`.
- Nâng Multer 2.x.

## 0.5.0 - Phần 5: Luồng đặt sân

- Tạo, xem, hủy booking và lịch sử đặt sân.
