# Phần 2 - Khung giao diện dùng chung

## 1. Mục tiêu đã hoàn thành

Phần 2 xây dựng giao diện công khai đầu tiên của hệ thống, gồm:

- Layout EJS dùng chung.
- Header, menu điều hướng và footer.
- Trang chủ đọc dữ liệu thật từ PostgreSQL.
- Trang danh sách sân đang hoạt động.
- Tìm kiếm theo từ khóa.
- Lọc theo khu vực và loại sân.
- Sắp xếp theo giá hoặc tên.
- Phân trang 9 sân mỗi trang.
- Giao diện responsive cho máy tính, máy tính bảng và điện thoại.
- Trang lỗi 404 và 500 dùng chung layout.

## 2. Các URL cần kiểm tra

Sau khi khởi động ứng dụng, mở lần lượt:

```text
http://localhost:3000/
http://localhost:3000/san-bong
http://localhost:3000/san-bong?type=San%205%20nguoi
http://localhost:3000/san-bong?sort=price_desc
http://localhost:3000/duong-dan-khong-ton-tai
```

Trang chủ và danh sách sân cần kết nối PostgreSQL vì dữ liệu được lấy trực tiếp từ:

- `san_bong`
- `khu_vuc`
- `chu_san`

## 3. Luồng xử lý dữ liệu

```text
Trình duyệt
    ↓
webRoutes.js
    ↓
homeController.js / pitchController.js
    ↓
pitchService.js
    ↓
pitchRepository.js
    ↓
PostgreSQL
```

Repository chỉ lấy các sân có:

```sql
trang_thai = 'Hoat dong'
```

Từ khóa tìm kiếm được áp dụng lên tên sân, địa chỉ, tên khu vực và quận/huyện. Các giá trị lọc được truyền bằng parameter của PostgreSQL để tránh nối trực tiếp dữ liệu người dùng vào câu SQL.

## 4. Những file chính đã thêm hoặc cập nhật

```text
src/app.js
src/routes/webRoutes.js
src/controllers/homeController.js
src/controllers/pitchController.js
src/services/pitchService.js
src/repositories/pitchRepository.js
src/middlewares/errorMiddleware.js

views/layouts/main.ejs
views/partials/header.ejs
views/partials/footer.ejs
views/partials/pitch-card.ejs
views/home/index.ejs
views/pitch/list.ejs
views/error/404.ejs
views/error/500.ejs

public/css/main.css
public/js/main.js
public/images/logo-football.svg
public/images/hero-football.svg
public/images/pitch-5.svg
public/images/pitch-7.svg
public/images/pitch-11.svg
public/images/pitch-default.svg
```

## 5. Ảnh hiện tại và ảnh cần chuẩn bị sau này

Hiện tại hệ thống dùng SVG minh họa nội bộ nên có thể chạy ngay mà không cần tải ảnh bên ngoài.

### Logo

File hiện tại:

```text
public/images/logo-football.svg
```

Khi có logo chính thức, nên dùng PNG nền trong suốt hoặc SVG. Có thể thay file này nhưng nên giữ nguyên tên để không phải sửa giao diện.

### Ảnh banner trang chủ

File hiện tại:

```text
public/images/hero-football.svg
```

Ảnh thật thay thế nên có kích thước tối thiểu khoảng `1200 x 900 px`, chủ thể nằm ở giữa hoặc phía bên phải để không che phần nội dung.

### Ảnh sân

Các file hiện tại:

```text
public/images/pitch-5.svg
public/images/pitch-7.svg
public/images/pitch-11.svg
public/images/pitch-default.svg
```

Các ảnh này chỉ là ảnh tạm theo loại sân. Database hiện chưa có cột đường dẫn ảnh nên mọi sân cùng loại đang dùng chung một ảnh.

Đến Phần 4 hoặc Phần 6 sẽ bổ sung migration lưu đường dẫn ảnh sân và chức năng upload. Khi đó nên chuẩn bị ảnh thật tỷ lệ `16:10` hoặc `16:9`, tối thiểu `1000 x 625 px`.

## 6. Chức năng cố ý chưa hoạt động

- Nút `Đăng nhập`: hoàn thiện ở Phần 3.
- Nút `Chọn sân`: hoàn thiện ở Phần 5.
- Trang chi tiết riêng của từng sân: hoàn thiện ở Phần 4.
- Ảnh riêng cho từng sân: bổ sung ở Phần 4 hoặc Phần 6.

Các nút chưa hoàn thiện được đặt trạng thái disabled để không dẫn tới URL lỗi.

## 7. Cách kiểm thử trên máy

Từ thư mục project:

```powershell
npm install
npm run dev
```

Nếu đã chạy server từ trước khi cập nhật Phần 2, cần dừng bằng `Ctrl + C`, chạy lại `npm install` vì project có thêm package `express-ejs-layouts`, sau đó mới chạy `npm run dev`.

### Kiểm thử trang chủ

- Header và footer hiển thị đúng.
- Số lượng sân, khu vực và chủ sân không phải số cố định mà khớp database.
- Có tối đa 6 sân nổi bật.
- Form khu vực và loại sân chuyển đúng sang `/san-bong`.

### Kiểm thử danh sách sân

- Chỉ hiển thị sân trạng thái `Hoat dong`.
- Mỗi trang tối đa 9 sân.
- Lọc khu vực và loại sân hoạt động.
- Tìm từ khóa không phân biệt chữ hoa/chữ thường.
- Sắp xếp giá tăng, giảm và tên A-Z hoạt động.
- Nút `Xóa lọc` trở về toàn bộ danh sách.

### Kiểm thử responsive

Mở DevTools bằng `F12`, bật chế độ thiết bị và kiểm tra các độ rộng:

```text
390 px   - điện thoại
768 px   - máy tính bảng
1366 px  - máy tính
```

Ở điện thoại, menu phải thu gọn thành nút ba gạch và danh sách sân chuyển thành một cột.
