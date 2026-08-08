# API Documentation

Base URL: `/api`.

Các API trả JSON theo dạng chung:

```json
{
  "success": true,
  "data": {}
}
```

Khi lỗi:

```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "code": "ERROR_CODE"
}
```

## Authentication / CSRF

API nghiệp vụ sử dụng cùng session cookie với web.

### `GET /api/auth/status`

Health check module auth.

### `GET /api/auth/me`

Yêu cầu đăng nhập. Trả user trong session, không trả mật khẩu.

### `GET /api/auth/csrf`

Yêu cầu đăng nhập. Trả token để client same-origin gọi API thay đổi dữ liệu:

```json
{
  "success": true,
  "data": {
    "csrfToken": "..."
  }
}
```

Các request `POST`, `PUT`, `PATCH`, `DELETE` phải gửi token bằng:

```http
x-csrf-token: <token>
```

hoặc body/form field `_csrf`.

## Health

### `GET /api/health`

Trả version ứng dụng, uptime và trạng thái PostgreSQL.

## Pitches

### `GET /api/pitches/status`

Health check module pitch.

### `GET /api/pitches/:pitchId/availability?date=YYYY-MM-DD`

Trả sân, khoảng ngày hợp lệ và các khung giờ `available`, `booked`, `past`.

## Customer

### `GET /api/customers/status`

Health check module customer.

### `GET /api/customers/summary`

Yêu cầu vai trò `Khach hang`. Trả tổng số đơn theo trạng thái, số hóa đơn đã thanh toán và tổng đã chi.

## Booking - Khách hàng

Tất cả endpoint dưới đây yêu cầu vai trò `Khach hang`.

### `GET /api/bookings?status=all&page=1`

`status`: `all | pending | confirmed | cancelled`.

### `POST /api/bookings`

Body:

```json
{
  "pitchId": "S01",
  "date": "2026-08-10",
  "slotId": "KG05"
}
```

Repository chạy transaction + advisory lock rồi gọi `fn_dat_san_bong`.

### `GET /api/bookings/:bookingId`

Chỉ trả đơn thuộc khách hàng hiện tại.

### `POST /api/bookings/:bookingId/cancel`

Hủy khi chưa thanh toán và chưa đến giờ bắt đầu; gọi `fn_huy_don_dat_san`.

## Owner

Tất cả endpoint yêu cầu vai trò `Chu san`.

### `GET /api/owners/status`
### `GET /api/owners/dashboard`
### `GET /api/owners/pitches`
### `GET /api/owners/bookings?status=all&pitch=S01&page=1`
### `POST /api/owners/bookings/:bookingId/confirm`

Endpoint xác nhận chỉ cho phép đơn thuộc sân của chủ sân đang đăng nhập và gọi `fn_xac_nhan_don_dat_san`.

Việc tạo/sửa sân và upload ảnh hiện được cung cấp bằng web form `/chu-san/...` vì sử dụng multipart upload.

## Payment / services

Tất cả endpoint yêu cầu vai trò `Khach hang` và booking phải thuộc user hiện tại.

### `GET /api/payments/:bookingId`

Chi tiết hóa đơn, catalog dịch vụ và dịch vụ đã chọn.

### `POST /api/payments/:bookingId/services`

Body:

```json
{
  "serviceId": "DV01",
  "quantity": 3
}
```

Gọi `fn_them_dich_vu_cho_don`; trigger tự tính lại hóa đơn.

### `POST /api/payments/:bookingId/services/:serviceId/remove`

Xóa dịch vụ khỏi booking trước thanh toán.

### `POST /api/payments/:bookingId/pay`

Thanh toán mô phỏng bằng `fn_thanh_toan_hoa_don`.

## Admin

Tất cả endpoint yêu cầu vai trò `Admin`.

### Dashboard

`GET /api/admin/dashboard`

### Accounts

- `GET /api/admin/accounts?q=&role=&status=&page=1`
- `POST /api/admin/accounts/:accountId/status`

Body `status`: `Hoat dong` hoặc `Bi khoa`.

### Areas

- `GET /api/admin/areas`
- `POST /api/admin/areas`
- `PUT /api/admin/areas/:areaId`
- `DELETE /api/admin/areas/:areaId`

### Monitoring

- `GET /api/admin/pitches`
- `GET /api/admin/bookings`
- `GET /api/admin/invoices`
- `GET /api/admin/statistics`

## HTTP status thường dùng

| Status | Ý nghĩa |
|---|---|
| 200 | Thành công |
| 302 | Web redirect sau thao tác thành công |
| 400 | Request sai định dạng |
| 401 | Chưa đăng nhập |
| 403 | Không đủ quyền / CSRF sai |
| 404 | Không tìm thấy dữ liệu |
| 409 | Xung đột nghiệp vụ, ví dụ slot vừa bị đặt |
| 422 | Validation thất bại |
| 500 | Lỗi không dự kiến |
