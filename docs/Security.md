# Security Checklist

## Đã áp dụng

### Authentication và session

- Mật khẩu đăng ký mới lưu bằng bcrypt cost 12.
- Dữ liệu seed plaintext được nâng cấp sang bcrypt sau lần đăng nhập thành công đầu tiên.
- Session lưu trong PostgreSQL bằng `connect-pg-simple`.
- Session ID được regenerate sau đăng nhập để chống session fixation.
- Cookie `httpOnly`, `sameSite=lax`; production bật `secure`.
- Khi Admin khóa tài khoản, session hiện có của tài khoản đó bị xóa.

### Authorization

- `requireAuth` bảo vệ chức năng cần đăng nhập.
- `requireRole` bảo vệ `Khach hang`, `Chu san`, `Admin`.
- Repository/service chủ sân và khách hàng luôn giới hạn dữ liệu theo `ownerId`/`customerId` từ session, không tin ID do trình duyệt gửi.

### CSRF

- Tất cả request thay đổi dữ liệu đi qua CSRF middleware.
- Form POST chứa `_csrf`.
- API có thể gửi `x-csrf-token`.
- Client đã đăng nhập có thể lấy token qua `GET /api/auth/csrf`.
- Upload multipart kiểm tra CSRF sau Multer và xóa file tạm nếu token sai.

### SQL

- Giá trị đầu vào truyền bằng PostgreSQL parameter `$1`, `$2`, ...
- Các phần ORDER BY động chỉ lấy từ whitelist cố định trong service.
- Các thao tác cạnh tranh như đặt sân, tạo mã và thanh toán dùng transaction/advisory lock.

### Upload

- Chỉ JPG, PNG, WebP.
- Tối đa 5 MB.
- Kiểm tra cả MIME và magic bytes/signature.
- Tên file dùng UUID, không dùng tên file do người dùng cung cấp.
- Chỉ xóa file bên trong `public/uploads/pitches`.

### HTTP hardening

- Tắt `X-Powered-By`.
- `Content-Security-Policy` chỉ cho phép tài nguyên cần thiết.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` tắt camera/microphone/geolocation.
- Trang/API chứa dữ liệu tài khoản, đơn, thanh toán và quản trị dùng `Cache-Control: no-store`.
- JSON/form body giới hạn 100 KB.

## Cấu hình production bắt buộc

- `NODE_ENV=production`.
- `SESSION_SECRET` tối thiểu 32 ký tự, ngẫu nhiên và không dùng giá trị mặc định.
- `DB_PASSWORD` không được rỗng.
- Chạy sau reverse proxy HTTPS; ứng dụng đã `trust proxy = 1` trong production.
- Không commit `.env` và ảnh upload runtime lên Git.

## Giới hạn hiện tại

- Thanh toán là mô phỏng trong database, không lưu thông tin thẻ/ngân hàng.
- Chưa có rate limiting phân tán. Khi triển khai public internet, nên đặt rate limit ở reverse proxy hoặc bổ sung middleware chuyên dụng.
- Tài khoản seed dùng mật khẩu đơn giản chỉ phục vụ demo/học tập; phải đổi khi triển khai thật.
