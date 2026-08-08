# Phần 6 - Quản lý của chủ sân

Phiên bản: `0.6.0`, nâng cấp từ `0.5.0`.

## Phạm vi đã hoàn thành

- Dashboard chủ sân tại `/chu-san`.
- Danh sách sân thuộc đúng `ma_chu_san` đang đăng nhập.
- Thêm sân bằng `fn_them_san_bong`.
- Chỉnh sửa tên, địa chỉ, loại sân, giá thuê, khu vực và ảnh.
- Chuyển trạng thái Hoạt động, Bảo trì hoặc Ngừng hoạt động.
- Chặn chuyển sang bảo trì/ngừng hoạt động nếu còn đơn tương lai.
- Danh sách và chi tiết đơn thuộc các sân của chủ sân.
- Xác nhận đơn bằng `fn_xac_nhan_don_dat_san`.
- Upload một ảnh JPG, PNG hoặc WebP, tối đa 5 MB.
- Session, phân quyền và CSRF cho cả form thường và form multipart.

## Migration database

Không xóa database và không chạy lại seed. Chỉ chạy:

```powershell
psql -U postgres -d dat_san_bong -f database/migrations/001_add_pitch_image_url.sql
```

Kiểm tra:

```powershell
psql -U postgres -d dat_san_bong -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='san_bong' AND column_name='image_url';"
```

## Cài dependency

```powershell
npm install
```

Phần 6 nâng Multer lên nhánh 2.x. Sau đó chạy:

```powershell
npm run verify
npm test
npm run dev
```

## Tài khoản kiểm thử

```text
Tên đăng nhập: chusan01
Mật khẩu: 123456
Mã chủ sân: CS01
```

Sau lần đăng nhập đầu tiên, mật khẩu mẫu có thể đã được tự nâng cấp sang bcrypt.

## Luồng kiểm thử

1. Mở `/chu-san` và kiểm tra số sân của CS01.
2. Mở `/chu-san/san-bong`.
3. Thêm một sân mới, có thể chưa chọn ảnh để dùng SVG mặc định.
4. Chỉnh sửa sân vừa tạo và upload ảnh thật.
5. Mở trang công khai của sân khi trạng thái là Hoạt động.
6. Tạo một đơn tương lai bằng tài khoản khách hàng cho sân của CS01.
7. Đăng nhập lại bằng `chusan01`.
8. Mở `/chu-san/don-dat-san?status=pending` và xác nhận đơn.
9. Đăng nhập khách hàng để kiểm tra trạng thái đã chuyển thành `Da xac nhan`.

## Ảnh cần chuẩn bị

Ảnh chưa bắt buộc để chạy chức năng. Khi muốn thay ảnh thật, chuẩn bị:

- JPG, PNG hoặc WebP.
- Ảnh ngang, khuyến nghị `1200 x 750 px` trở lên.
- Dung lượng không vượt quá 5 MB.
- Không có watermark lớn.

Ảnh upload được lưu tại `public/uploads/pitches`. Database chỉ lưu đường dẫn công khai trong `san_bong.image_url`.
