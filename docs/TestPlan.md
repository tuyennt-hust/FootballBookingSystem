# Test Plan

## 1. Static verification

```powershell
npm run verify
```

Kiểm tra version, file bắt buộc, import nội bộ, compile EJS và runtime load khi dependency đã cài.

## 2. Security/architecture audit

```powershell
npm run audit
```

Kiểm tra:

- security middleware đã gắn vào app;
- EJS không còn inline event handler;
- mọi form thay đổi dữ liệu đều có `_csrf`;
- repository không truy cập trực tiếp `req.body/query/params`;
- `.env` và upload runtime được ignore;
- bảng/function/trigger cốt lõi tồn tại trong source SQL;
- artifact tài liệu/sơ đồ cuối có đầy đủ.

## 3. Unit tests

```powershell
npm test
```

Nhóm test:

- session redirect;
- authentication/bcrypt;
- CSRF/security;
- date/time;
- pitch availability;
- booking cancellation;
- owner validation;
- services/payment;
- admin validation;
- customer authorization.

## 4. Database invariant check

```powershell
npm run db:check
```

Lệnh này dùng `.env`, vì vậy PostgreSQL phải đang chạy.

Có thể chạy SQL tương đương:

```powershell
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f tests/database/final_smoke_test.sql
```

## 5. Manual smoke test trên trình duyệt

### Public

1. `/api/health` trả `version: 0.9.0` và `connected: true`.
2. `/` tải trang chủ.
3. `/san-bong` lọc/tìm kiếm/phân trang được.
4. `/san-bong/S01` hiển thị lịch trống.

### Khách hàng

1. Đăng ký tài khoản mới.
2. Đăng nhập.
3. Chọn sân/ngày/slot và tạo đơn.
4. Thử đặt trùng ở tab thứ hai -> phải bị từ chối.
5. Xem lịch sử và chi tiết đơn.
6. Chủ sân xác nhận đơn.
7. Khách thêm/xóa dịch vụ.
8. Thanh toán.
9. Sau thanh toán không được sửa dịch vụ/hủy đơn.

### Chủ sân

1. Đăng nhập `chusan01`.
2. Xem dashboard.
3. Tạo sân với giá tròn `200000`.
4. Upload ảnh hợp lệ.
5. Thử upload file sai định dạng/over 5 MB -> phải bị từ chối.
6. Sửa sân và thay trạng thái.
7. Xác nhận đơn thuộc sân của mình.
8. Thử truy cập đơn/sân của chủ khác -> phải bị từ chối.

### Admin

1. Đăng nhập `admin`.
2. Xem dashboard.
3. Khóa/mở khóa khách hàng.
4. Tạo/sửa/xóa khu vực chưa được dùng.
5. Thử xóa khu vực có sân -> phải bị từ chối.
6. Xem sân, đơn, hóa đơn và báo cáo.

## 6. Responsive/accessibility

Kiểm tra desktop và viewport khoảng 390 px:

- menu mobile mở/đóng được bằng nút và Escape;
- không tràn ngang ở form chính;
- tab focus nhìn thấy rõ;
- skip-link xuất hiện khi bấm Tab đầu tiên;
- chức năng vẫn dùng được khi bật `prefers-reduced-motion`.
