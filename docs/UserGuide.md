# User Guide

## 1. Khách chưa đăng nhập

- Trang chủ: `/`
- Danh sách sân: `/san-bong`
- Chi tiết sân: `/san-bong/:pitchId`
- Đăng ký: `/dang-ky`
- Đăng nhập: `/dang-nhap`

Có thể tìm sân theo từ khóa, khu vực, loại sân và sắp xếp giá.

## 2. Khách hàng

### Đặt sân

1. Đăng nhập tài khoản khách hàng.
2. Mở chi tiết sân.
3. Chọn ngày trong cửa sổ 30 ngày.
4. Chọn khung giờ còn trống.
5. Bấm `Tiếp tục đặt sân`.
6. Kiểm tra thông tin và xác nhận.
7. Đơn mới có trạng thái `Chờ xác nhận`.

### Lịch sử/hủy

Mở `/lich-su-dat-san`.

Có thể hủy nếu:

- đơn chưa bị hủy;
- hóa đơn chưa thanh toán;
- chưa đến giờ bắt đầu.

### Dịch vụ và thanh toán

Sau khi chủ sân xác nhận:

1. Mở chi tiết đơn.
2. Chọn `Chọn dịch vụ & thanh toán`.
3. Thêm dịch vụ với số lượng 1-20.
4. Có thể xóa dịch vụ trước khi thanh toán.
5. Bấm thanh toán.
6. Sau khi `Đã thanh toán`, hóa đơn ở chế độ chỉ đọc.

Thanh toán hiện là mô phỏng trong hệ thống, không kết nối cổng ngân hàng.

## 3. Chủ sân

Đăng nhập tài khoản có vai trò `Chu san`, sau đó mở `/chu-san`.

### Dashboard

Theo dõi số sân, đơn chờ xác nhận, lịch hôm nay và doanh thu đã thanh toán.

### Quản lý sân

`/chu-san/san-bong`

- Tạo sân mới; mã được sinh tự động.
- Giá thuê nhận giá trị tròn như `200000`.
- Chọn loại sân và khu vực.
- Upload JPG/PNG/WebP tối đa 5 MB.
- Sửa thông tin/ảnh.
- Chuyển `Hoat dong`, `Bao tri`, `Ngung hoat dong` khi hợp lệ.

### Quản lý đơn

`/chu-san/don-dat-san`

- Lọc theo trạng thái/sân.
- Xem chi tiết.
- Xác nhận đơn `Cho xac nhan` thuộc sân của mình.

## 4. Admin

Mở `/admin`.

### Tài khoản

`/admin/tai-khoan`

- Tìm/lọc tài khoản.
- Khóa hoặc mở khóa khách/chủ sân.
- Không thể khóa Admin từ giao diện này.
- Khi khóa, session hiện tại của tài khoản bị thu hồi.

### Khu vực

`/admin/khu-vuc`

- Thêm/sửa khu vực.
- Chỉ xóa được khu vực chưa có sân.

### Theo dõi

- `/admin/san-bong`
- `/admin/don-dat-san`
- `/admin/hoa-don`

### Thống kê

`/admin/thong-ke`

Bao gồm top khách hàng, phân loại khách hàng, doanh thu theo tháng/sân/khu vực, dịch vụ bán chạy và tỷ lệ hủy.

## 5. Tài khoản và đăng xuất

`/tai-khoan` hiển thị thông tin session hiện tại. Dùng nút `Đăng xuất` trên header để hủy session.

## 6. Tài khoản demo

Dữ liệu mẫu có các tài khoản như:

```text
Khách hàng: khach01 / 123456
Chủ sân:    chusan01 / 123456
Admin:      admin / 123456
```

Các mật khẩu này chỉ dành cho môi trường học tập/demo. Sau lần đăng nhập đầu, tài khoản seed plaintext được nâng cấp sang bcrypt.
