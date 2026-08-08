# Phần 1 - Cấu hình ứng dụng và kết nối PostgreSQL

## 1. Mục tiêu

Phần này tạo nền tảng để các module đăng nhập, sân bóng, đặt sân và thanh toán có thể dùng chung một kết nối PostgreSQL ổn định.

Server chỉ bắt đầu lắng nghe request sau khi truy vấn thử tới PostgreSQL thành công. Nếu cấu hình database sai, chương trình dừng ngay và in lỗi thay vì mở server trong trạng thái không sử dụng được.

## 2. Các file đã hoàn thiện

### `src/config/env.js`

Nhiệm vụ:

- Đọc file `.env`.
- Cung cấp cấu hình server và database cho toàn dự án.
- Chuyển các biến dạng số như `PORT`, `DB_PORT` về kiểu `Number`.
- Kiểm tra cổng hợp lệ.
- Báo lỗi rõ ràng khi thiếu biến bắt buộc.

Các biến đang sử dụng:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dat_san_bong
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=5000
```

### `src/config/database.js`

Nhiệm vụ:

- Tạo một `Pool` của thư viện `pg`.
- Cho phép nhiều request tái sử dụng kết nối thay vì mở kết nối mới liên tục.
- Cung cấp ba hàm chính:
  - `query(text, params)`: thực thi SQL.
  - `testConnection()`: kiểm tra PostgreSQL.
  - `close()`: đóng pool khi tắt ứng dụng.

Repository sử dụng theo mẫu:

```js
const db = require('../config/database');

const result = await db.query(
  'SELECT * FROM san_bong WHERE ma_san = $1',
  [maSan],
);
```

Dùng `$1`, `$2` và mảng tham số để tránh nối chuỗi SQL trực tiếp.

### `src/controllers/healthController.js`

Nhiệm vụ:

- Gọi `db.testConnection()`.
- Trả trạng thái ứng dụng và PostgreSQL.
- Trả HTTP 503 khi không kết nối được database.

### `src/routes/index.js`

Bổ sung endpoint:

```text
GET /api/health
```

### `src/server.js`

Trình tự khởi động:

1. Đọc cấu hình.
2. Kết nối thử PostgreSQL.
3. Kết nối thành công mới gọi `app.listen()`.
4. Khi nhận `Ctrl + C`, đóng HTTP server và PostgreSQL pool.

### `src/middlewares/errorMiddleware.js`

Xử lý hai loại response:

- URL bắt đầu bằng `/api`: trả JSON.
- Trang web thông thường: render trang lỗi EJS.

Đã thêm:

- `views/error/404.ejs`
- `views/error/500.ejs`

## 3. Cách chạy trên Windows

Mở terminal tại thư mục `FootballBookingSystem`.

### Bước 1: tạo file `.env`

```powershell
Copy-Item .env.example .env
```

Mở `.env` và sửa:

```env
DB_PASSWORD=mat_khau_postgresql_cua_ban
```

### Bước 2: cài thư viện

```powershell
npm install
```

### Bước 3: bảo đảm database đã được tạo

```powershell
psql -U postgres -d dat_san_bong -f database/01_schema.sql
psql -U postgres -d dat_san_bong -f database/02_seed.sql
psql -U postgres -d dat_san_bong -f database/03_functions.sql
psql -U postgres -d dat_san_bong -f database/04_triggers.sql
psql -U postgres -d dat_san_bong -f database/05_views.sql
```

### Bước 4: chạy ứng dụng

```powershell
npm run dev
```

Terminal đúng sẽ có thông báo gần giống:

```text
[DATABASE] Ket noi PostgreSQL thanh cong
[DATABASE] Database: dat_san_bong
[DATABASE] User: postgres
[SERVER] FootballBookingSystem: http://localhost:3000
[SERVER] Kiem tra he thong: http://localhost:3000/api/health
```

### Bước 5: kiểm tra endpoint

Mở:

```text
http://localhost:3000/api/health
```

Kết quả đúng:

```json
{
  "success": true,
  "message": "He thong dang hoat dong",
  "data": {
    "application": {
      "environment": "development",
      "uptimeSeconds": 5
    },
    "database": {
      "connected": true,
      "name": "dat_san_bong",
      "user": "postgres"
    }
  }
}
```

## 4. Một số lỗi thường gặp

### `password authentication failed for user "postgres"`

Nguyên nhân: `DB_PASSWORD` trong `.env` không đúng.

### `database "dat_san_bong" does not exist`

Tạo database trước:

```powershell
createdb -U postgres dat_san_bong
```

Sau đó chạy năm file SQL khởi tạo.

### `ECONNREFUSED 127.0.0.1:5432`

PostgreSQL chưa chạy hoặc đang dùng cổng khác. Kiểm tra PostgreSQL Service trên Windows hoặc sửa `DB_PORT`.

### `EADDRINUSE: address already in use :::3000`

Cổng 3000 đang được chương trình khác sử dụng. Sửa trong `.env`:

```env
PORT=3001
```

## 5. Ảnh cần bổ sung

Phần 1 không cần logo, ảnh sân hay icon. Tất cả nội dung của phần này là cấu hình và kết nối hệ thống.
