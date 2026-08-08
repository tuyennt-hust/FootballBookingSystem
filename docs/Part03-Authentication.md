# Phần 3 - Đăng ký, đăng nhập, session và đăng xuất

## 1. Phạm vi đã hoàn thiện

- Trang đăng nhập tại `GET /dang-nhap`.
- Trang đăng ký khách hàng tại `GET /dang-ky`.
- Đăng nhập bằng tài khoản trong bảng `tai_khoan`.
- Đăng ký qua PostgreSQL function `fn_dang_ky_khach_hang`.
- Lưu phiên đăng nhập trong PostgreSQL bằng bảng `web_session`.
- Trang thông tin tài khoản tại `GET /tai-khoan`.
- Đăng xuất bằng `POST /dang-xuat`.
- Middleware yêu cầu đăng nhập và middleware kiểm tra vai trò.
- Chặn tài khoản có trạng thái `Bi khoa`.
- Chống session fixation bằng cách tạo lại session sau khi đăng nhập.
- Cookie session có `httpOnly`, `sameSite=lax` và thời gian hết hạn.
- Mã CSRF cho các form sử dụng phương thức POST.
- Mật khẩu tài khoản mới được băm bằng bcrypt.
- Tài khoản dữ liệu mẫu đang lưu mật khẩu cũ sẽ tự nâng cấp sang bcrypt sau lần đăng nhập thành công.

Phần này không cần bổ sung hình ảnh mới.

## 2. Các file chính

```text
src/config/env.js
src/app.js
src/controllers/authController.js
src/services/authService.js
src/repositories/authRepository.js
src/routes/authRoutes.js
src/routes/authWebRoutes.js
src/middlewares/authMiddleware.js
src/middlewares/csrfMiddleware.js
src/utils/AppError.js
src/utils/session.js
views/auth/login.ejs
views/auth/register.ejs
views/auth/profile.ejs
views/partials/header.ejs
views/partials/flash.ejs
public/css/main.css
public/js/main.js
database/03_functions.sql
```

## 3. Cập nhật từ bản Phần 2

### Bước 1: dừng server cũ

Trong terminal đang chạy `npm run dev`, nhấn:

```text
Ctrl + C
```

### Bước 2: giữ lại file `.env`

File ZIP không chứa `.env`. Khi thay thư mục project bằng bản mới, hãy sao chép `.env` cũ sang thư mục mới.

Bổ sung vào cuối `.env`:

```env
SESSION_SECRET=mot-chuoi-ngau-nhien-dai-va-kho-doan
SESSION_COOKIE_NAME=football.sid
SESSION_MAX_AGE_MS=28800000
```

`28800000` mili giây tương ứng 8 giờ.

### Bước 3: cài dependency mới

```powershell
npm install
```

Các package mới của Phần 3:

```text
bcryptjs
express-session
connect-pg-simple
```

### Bước 4: cập nhật function đăng nhập trong PostgreSQL

Không cần xóa database và không cần chạy lại seed. Chỉ chạy lại file function:

```powershell
psql -U postgres -d dat_san_bong -f database/03_functions.sql
```

File này bật extension `pgcrypto` và cập nhật `fn_dang_nhap` để function SQL vẫn kiểm tra được cả mật khẩu dữ liệu mẫu dạng cũ và mật khẩu bcrypt.

### Bước 5: chạy server

```powershell
npm run dev
```

## 4. Tài khoản kiểm thử

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Khách hàng | `khach01` | `123456` |
| Chủ sân | `chusan01` | `123456` |
| Admin | `admin` | `123456` |
| Tài khoản bị khóa | `khach24` | `123456` |

## 5. Luồng kiểm thử bắt buộc

### 5.1 Đăng nhập đúng

Mở:

```text
http://localhost:3000/dang-nhap
```

Đăng nhập bằng `khach01 / 123456`.

Kết quả mong đợi:

- Chuyển đến `/tai-khoan`.
- Header hiện tên khách hàng và vai trò.
- Trang tài khoản hiện mã tài khoản và mã khách hàng.
- Làm mới trình duyệt vẫn còn đăng nhập.

### 5.2 Kiểm tra API session

Trong khi đang đăng nhập, mở:

```text
http://localhost:3000/api/auth/me
```

Kết quả mong đợi có `success: true` và dữ liệu tài khoản, nhưng không có mật khẩu.

### 5.3 Đăng xuất

Bấm `Đăng xuất` trên header hoặc trang tài khoản.

Kết quả mong đợi:

- Chuyển về trang đăng nhập.
- Mở lại `/tai-khoan` sẽ bị chuyển về `/dang-nhap`.
- `/api/auth/me` trả mã HTTP 401.

### 5.4 Đăng nhập sai

Nhập đúng tên tài khoản nhưng sai mật khẩu.

Kết quả mong đợi:

```text
Tên đăng nhập hoặc mật khẩu không đúng.
```

### 5.5 Tài khoản bị khóa

Đăng nhập bằng `khach24 / 123456`.

Kết quả mong đợi:

```text
Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.
```

### 5.6 Đăng ký khách hàng mới

Mở:

```text
http://localhost:3000/dang-ky
```

Dùng một tên đăng nhập chưa tồn tại, ví dụ `khach_demo`.

Kết quả mong đợi:

- Đăng ký thành công và chuyển về trang đăng nhập.
- Có thể đăng nhập bằng tài khoản vừa tạo.
- Tài khoản mới có vai trò `Khach hang`.

Kiểm tra PostgreSQL:

```powershell
psql -U postgres -d dat_san_bong -c "SELECT ten_dang_nhap, LEFT(mat_khau, 4) AS prefix, LENGTH(mat_khau) AS do_dai FROM tai_khoan WHERE ten_dang_nhap = 'khach_demo';"
```

Kết quả mật khẩu bcrypt cần có prefix `$2a$` và độ dài 60.

Kiểm tra function SQL vẫn đăng nhập được:

```powershell
psql -U postgres -d dat_san_bong -c "SELECT * FROM fn_dang_nhap('khach_demo', 'mat_khau_da_dang_ky');"
```

### 5.7 Kiểm tra session PostgreSQL

Sau khi mở trang đăng nhập hoặc đăng nhập thành công:

```powershell
psql -U postgres -d dat_san_bong -c "SELECT sid, expire FROM web_session ORDER BY expire DESC LIMIT 5;"
```

Bảng `web_session` được ứng dụng tự tạo, không cần tạo thủ công.

## 6. Kiểm thử mã nguồn

```powershell
npm test
```

Bộ test hiện kiểm tra URL chuyển hướng nội bộ để tránh open redirect. Các test repository và luồng tích hợp sẽ được mở rộng ở Phần 9.

## 7. Nội dung chưa làm trong Phần 3

- Quên mật khẩu.
- Đổi mật khẩu trên giao diện.
- Dashboard riêng cho từng vai trò.
- Quản lý hồ sơ chi tiết.
- Giới hạn số lần đăng nhập sai.

Các dashboard và chức năng nghiệp vụ sẽ được nối vào middleware phân quyền ở những phần sau.
