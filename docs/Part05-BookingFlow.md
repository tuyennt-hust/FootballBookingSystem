# Phần 5 - Tạo đơn, lịch sử đặt sân và hủy đơn

Phần 5 nối luồng chọn sân ở Phần 4 với các bảng `dat_san`, `thanh_toan` và các function PostgreSQL hiện có.

## Chức năng đã hoàn thiện

- Xác nhận tạo đơn bằng `fn_dat_san_bong`.
- Kiểm tra lại lịch trống trước khi ghi dữ liệu.
- Khóa giao dịch theo sân, ngày và khung giờ để giảm nguy cơ hai người đặt đồng thời.
- Tự sinh mã đặt sân dạng `DSxxx`.
- Trigger tự tính tiền sân, cộng 20% cho giờ điểm.
- Trigger tự tạo hóa đơn `Chua thanh toan`.
- Trang lịch sử đặt sân theo tài khoản khách hàng.
- Lọc trạng thái: tất cả, chờ xác nhận, đã xác nhận, đã hủy.
- Trang chi tiết đơn và hóa đơn.
- Hủy đơn bằng `fn_huy_don_dat_san` khi đơn chưa thanh toán và chưa đến giờ bắt đầu.
- Kiểm tra quyền sở hữu: khách hàng chỉ xem và hủy đơn của chính mình.

## URL giao diện

```text
GET  /dat-san/tao
POST /dat-san
GET  /lich-su-dat-san
GET  /dat-san/:bookingId
POST /dat-san/:bookingId/huy
```

## API

```text
GET  /api/bookings
POST /api/bookings
GET  /api/bookings/:bookingId
POST /api/bookings/:bookingId/cancel
```

Request thay đổi dữ liệu phải gửi CSRF token.

## Không cần thay đổi database

Phần 5 sử dụng trực tiếp:

- `fn_dat_san_bong`
- `fn_huy_don_dat_san`
- `tg_kiem_tra_trung_lich`
- `tg_tinh_tien_san`
- `tg_tao_hoa_don`

Nếu database của Phần 3 và Phần 4 đang chạy đúng, không cần chạy lại SQL.

## Quy trình kiểm thử

1. Đăng nhập bằng tài khoản khách hàng, ví dụ `khach01 / 123456`.
2. Mở `/san-bong/S01` và chọn một ngày tương lai, khung giờ còn trống.
3. Bấm `Tiếp tục đặt sân`.
4. Kiểm tra thông tin rồi bấm `Xác nhận đặt sân`.
5. Hệ thống chuyển đến `/dat-san/DS...` và hiển thị thông báo thành công.
6. Mở `/lich-su-dat-san`, đơn mới phải có trạng thái `Chờ xác nhận`.
7. Kiểm tra PostgreSQL:

```sql
SELECT ds.ma_dat_san, ds.trang_thai_dat, ds.tien_san,
       tt.ma_thanh_toan, tt.tong_tien, tt.trang_thai_thanh_toan
FROM dat_san ds
JOIN thanh_toan tt ON tt.ma_dat_san = ds.ma_dat_san
WHERE ds.ma_khach_hang = 'KH01'
ORDER BY ds.ma_dat_san DESC
LIMIT 5;
```

8. Hủy đơn trên trang chi tiết. Trạng thái phải đổi thành `Da huy`, tổng tiền hóa đơn về `0` và khung giờ mở lại.
9. Chạy test:

```powershell
npm test
```

## Trường hợp cần kiểm tra thêm

- Mở cùng một khung giờ ở hai tab, tạo đơn ở tab thứ nhất rồi xác nhận tab thứ hai. Tab thứ hai phải báo khung giờ đã được đặt.
- Đăng nhập bằng khách hàng khác và thử mở mã đơn không thuộc tài khoản đó. Hệ thống phải trả `404`.
- Đơn đã thanh toán hoặc đã qua giờ bắt đầu không được phép hủy.

## Hình ảnh

Phần 5 không cần ảnh mới. Giao diện tiếp tục dùng ảnh sân tạm theo loại sân.
