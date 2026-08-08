# Phần 4 - Chi tiết sân và lịch trống

## 1. Mục tiêu

Phần 4 nối tiếp trực tiếp Phần 1, 2 và 3. Phần này chưa tạo bản ghi mới trong `dat_san`, mà tập trung vào việc giúp khách hàng:

- Mở trang chi tiết của một sân đang hoạt động.
- Xem thông tin sân, khu vực và chủ sân.
- Chọn ngày trong 30 ngày tiếp theo.
- Xem toàn bộ khung giờ cùng trạng thái còn trống, đã đặt hoặc đã qua giờ.
- Xem giá chính xác của ca thường và ca giờ điểm.
- Chọn một khung giờ và mở trang kiểm tra thông tin trước khi đặt.

## 2. URL mới

```text
GET /san-bong/:pitchId
GET /san-bong/:pitchId?date=YYYY-MM-DD
GET /api/pitches/:pitchId/availability?date=YYYY-MM-DD
GET /dat-san/tao?pitchId=S01&date=YYYY-MM-DD&slotId=KG01
```

`/dat-san/tao` yêu cầu đăng nhập bằng vai trò `Khach hang`. Trang này chỉ kiểm tra và hiển thị dữ liệu; chưa ghi đơn đặt sân vào database.

## 3. Logic xác định lịch trống

Một khung giờ được coi là đã đặt khi tồn tại bản ghi trong `dat_san` có cùng:

- `ma_san`
- `ma_khung_gio`
- `ngay_dat`

và `trang_thai_dat <> 'Da huy'`.

Do đó đơn `Cho xac nhan` và `Da xac nhan` đều chiếm lịch, còn đơn `Da huy` không chiếm lịch.

Với ngày hiện tại, các khung giờ đã bắt đầu hoặc đã qua cũng không được chọn.

## 4. Giá hiển thị

- Ca thường: `san_bong.gia_thue`.
- Giờ điểm: `san_bong.gia_thue * 1.2`.

Cách tính này khớp với trigger `trg_tinh_tien_san`. Phần 5 vẫn phải để trigger tính lại khi tạo đơn nhằm tránh tin hoàn toàn vào dữ liệu từ trình duyệt.

## 5. Ảnh sân

Phần 4 hiện tiếp tục sử dụng các SVG mặc định theo loại sân:

```text
public/images/pitch-5.svg
public/images/pitch-7.svg
public/images/pitch-11.svg
```

Chưa cần gửi ảnh thật để kiểm thử chức năng.

Khi làm upload ảnh ở phần quản lý chủ sân, nên chuẩn bị:

- Tối thiểu 1 ảnh bìa cho mỗi sân.
- Tỷ lệ 16:10 hoặc 4:3.
- Kích thước khuyến nghị 1200 x 750 px trở lên.
- Định dạng JPG, PNG hoặc WebP.
- Ảnh ngang, đủ sáng, không có watermark lớn.

## 6. Không cần cập nhật database

Phần 4 không thay đổi schema, function hoặc trigger. Không chạy lại các file SQL và không xóa dữ liệu hiện có.

## 7. Kiểm thử

### Trang chi tiết

```text
http://localhost:3000/san-bong/S01
```

Cần thấy:

- Thông tin sân S01.
- Ngày mặc định là hôm nay; nếu khung giờ cuối đã bắt đầu thì mặc định chuyển sang ngày mai.
- 7 khung giờ từ bảng `khung_gio`.
- Giá giờ điểm cao hơn 20%.

### Chọn ngày

Chọn một ngày trong 30 ngày tới và bấm `Xem lịch`. URL phải có tham số `date`.

### API lịch trống

```text
http://localhost:3000/api/pitches/S01/availability?date=2026-08-06
```

Response phải có `success: true`, thông tin sân và mảng `availability` gồm 7 phần tử.

### Kiểm tra chuyển sang bước chuẩn bị đặt sân

1. Đăng nhập tài khoản khách hàng.
2. Mở trang chi tiết sân.
3. Chọn một khung giờ còn trống.
4. Bấm `Tiếp tục đặt sân`.
5. Trang `/dat-san/tao` phải hiển thị đúng sân, ngày, khung giờ và giá.

Nếu chưa đăng nhập, hệ thống phải chuyển đến `/dang-nhap` và quay lại trang chuẩn bị sau khi đăng nhập thành công.

### Unit test

```powershell
npm test
```

Kết quả phải có 8 test đạt: 3 test session cũ và 5 test ngày/giờ, phạm vi đặt sân mới.


## 8. Kiểm thử trạng thái đã đặt bằng transaction

Dữ liệu seed hiện chủ yếu ở tháng 06/2026 nên ngày tương lai có thể chưa có đơn. Có thể chạy script sau để tạo tạm một đơn ngày mai và tự rollback:

```powershell
psql -U postgres -d dat_san_bong -f tests/database/availability_preview_test.sql
```

Script không giữ lại dữ liệu sau khi kết thúc.
