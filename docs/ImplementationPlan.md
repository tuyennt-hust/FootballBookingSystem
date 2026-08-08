# Kế hoạch triển khai FootballBookingSystem

Project được chia thành 9 phần và chỉ chuyển phần sau khi phần trước đã chạy ổn định trên PostgreSQL thật.

| Phần | Nội dung | Trạng thái |
|---|---|---|
| 1 | Cấu hình Node.js, PostgreSQL, health check | ✅ |
| 2 | Layout EJS, trang chủ, danh sách sân | ✅ |
| 3 | Đăng ký, đăng nhập, session, phân quyền nền | ✅ |
| 4 | Chi tiết sân, ngày và khung giờ trống | ✅ |
| 5 | Tạo đơn, lịch sử, hủy đơn | ✅ |
| 6 | Dashboard/quản lý sân/xác nhận đơn cho chủ sân | ✅ |
| 7 | Dịch vụ, hóa đơn, thanh toán mô phỏng | ✅ |
| 8 | Dashboard và quản trị toàn hệ thống | ✅ |
| 9 | Audit, security hardening, test, tài liệu, sơ đồ | ✅ |

## Artifact cuối

- `docs/API.md`
- `docs/Database.md`
- `docs/UserGuide.md`
- `docs/Deployment.md`
- `docs/TestPlan.md`
- `docs/Security.md`
- `diagrams/ERD.png`
- `diagrams/UseCase.png`
- `diagrams/Architecture.png`
- `diagrams/SequenceBooking.png`

## Ảnh sản phẩm

Ảnh thật không bắt buộc để project chạy. Hiện hệ thống có SVG mặc định và upload ảnh sân từ Phần 6.

Để hoàn thiện portfolio/video demo sau khi kiểm thử v0.9.0, nên bổ sung:

- logo riêng nếu có;
- banner trang chủ;
- ảnh thật cho một số sân nổi bật.
