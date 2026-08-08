# Phần 9 - Kiểm thử, bảo mật, tài liệu và đóng gói cuối

Phiên bản mục tiêu: `0.9.0`.

## Mục tiêu

Phần 9 không bổ sung nghiệp vụ lớn. Mục tiêu là đưa các phần 1-8 thành một project nhất quán, có thể kiểm tra, giải thích và triển khai lại.

## Nội dung đã hoàn thiện

- Audit lại kiến trúc `Route -> Controller -> Service -> Repository -> PostgreSQL`.
- Hoàn thiện module `customer` còn ở dạng khung bằng API thống kê cá nhân `GET /api/customers/summary`.
- Thêm security headers và tắt header `X-Powered-By`.
- Thêm Content-Security-Policy, giới hạn body request 100 KB và `Cache-Control: no-store` cho trang/API nhạy cảm.
- Xóa inline JavaScript khỏi EJS; các form xác nhận dùng `data-confirm` + `public/js/main.js`.
- Bổ sung skip-link, focus state và `prefers-reduced-motion` cho accessibility.
- Production bắt buộc `SESSION_SECRET` đủ dài và `DB_PASSWORD` không rỗng.
- Thêm endpoint `GET /api/auth/csrf` cho client API đã đăng nhập.
- Thêm test cho authentication, pitch availability, CSRF/security và customer guard.
- Thêm `npm run audit`, `npm run check`, `npm run db:check`.
- Thêm SQL smoke test chỉ đọc dữ liệu.
- Hoàn thiện `API.md`, `Database.md`, `UserGuide.md`, `Deployment.md`, `TestPlan.md`, `Security.md`.
- Tạo bốn sơ đồ chính thức từ thiết kế cuối: ERD, Use Case, Architecture và Sequence Booking.

## Không thay đổi

- Không thêm package npm.
- Không cần migration database mới.
- Không xóa hoặc tạo lại dữ liệu.
- Không thay đổi function/trigger nghiệp vụ đã kiểm thử ở các phần trước.

## Bộ kiểm tra cuối

Chạy khi server đang dừng:

```powershell
npm run check
npm run db:check
```

`npm run check` gồm:

```text
verify -> audit -> unit tests
```

`npm run db:check` kết nối database thật trong `.env` và kiểm tra:

- đủ bảng/view/function/trigger bắt buộc;
- không có slot hoạt động bị đặt trùng;
- mọi đơn đều có hóa đơn;
- tổng hóa đơn đúng bằng tiền sân + dịch vụ;
- thành tiền dịch vụ đúng bằng số lượng x đơn giá.

Có thể chạy smoke test PostgreSQL độc lập:

```powershell
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f tests/database/final_smoke_test.sql
```

## Sơ đồ

- `diagrams/ERD.png`
- `diagrams/UseCase.png`
- `diagrams/Architecture.png`
- `diagrams/SequenceBooking.png`

Source nằm trong `diagrams/source/` để có thể sửa và render lại; Sequence Booking có SVG editable riêng để giữ đúng bố cục sequence.

## Ảnh sản phẩm

Project vẫn chạy hoàn chỉnh với SVG mặc định. Để dùng cho portfolio/video demo, nên thay bằng ảnh thật sau khi toàn bộ chức năng đã ổn định:

- logo riêng nếu có;
- 1 hero/banner ngang;
- 1 ảnh ngang cho mỗi sân quan trọng;
- ảnh sân nên là JPG/WebP khoảng 1200 x 750 px, sáng và không watermark lớn.

Ảnh thật không phải điều kiện để vượt qua kiểm thử kỹ thuật Phần 9.
