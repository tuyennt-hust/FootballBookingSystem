# FootballBookingSystem

Hệ thống quản lý và đặt sân bóng sử dụng **Node.js + Express + EJS + PostgreSQL**, tổ chức theo kiến trúc:

```text
Route -> Middleware -> Controller -> Service -> Repository -> PostgreSQL
```

Phiên bản hoàn thiện theo kế hoạch 9 phần: **v0.9.0**.

## Chức năng

### Khách hàng

- Đăng ký/đăng nhập/đăng xuất.
- Tìm sân theo từ khóa, khu vực, loại sân và giá.
- Xem chi tiết sân và khung giờ trống.
- Đặt sân, xem lịch sử, hủy đơn hợp lệ.
- Chọn dịch vụ và thanh toán mô phỏng.

### Chủ sân

- Dashboard.
- Quản lý sân, giá, trạng thái và ảnh đại diện.
- Xem đơn thuộc sân của mình.
- Xác nhận đơn.
- Theo dõi doanh thu đã thanh toán.

### Admin

- Dashboard toàn hệ thống.
- Khóa/mở khóa tài khoản.
- Quản lý khu vực.
- Theo dõi sân, booking, hóa đơn.
- Báo cáo doanh thu/khách hàng/dịch vụ/tỷ lệ hủy.

## Cấu trúc

```text
FootballBookingSystem/
├── database/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   └── utils/
├── public/
├── views/
├── diagrams/
├── docs/
├── scripts/
├── tests/
├── .env.example
├── package.json
└── README.md
```

## 1. Tạo database mới

```powershell
psql -U postgres -c "CREATE DATABASE dat_san_bong;"
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/01_schema.sql
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/02_seed.sql
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/03_functions.sql
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/04_triggers.sql
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/05_views.sql
```

Không chạy `06_queries.sql` hoặc `07_big_data.sql` khi chỉ muốn khởi tạo app.

## 2. Environment

```powershell
Copy-Item .env.example .env
```

Sửa ít nhất `DB_PASSWORD` và `SESSION_SECRET`.

## 3. Cài và chạy

```powershell
npm install
npm run dev
```

Mở:

```text
http://localhost:3000
http://localhost:3000/api/health
```

## 4. Kiểm tra toàn project

```powershell
npm run check
npm run db:check
```

Trong đó:

- `npm run verify`: kiểm tra cấu trúc/import/EJS.
- `npm run audit`: security + CSRF + artifact + architecture audit.
- `npm test`: unit tests.
- `npm run db:check`: kiểm tra database thật và các bất biến dữ liệu.

## 5. Tài khoản demo

```text
Khách hàng: khach01 / 123456
Chủ sân:    chusan01 / 123456
Admin:      admin / 123456
```

Chỉ dùng cho local/demo. Mật khẩu seed được nâng cấp sang bcrypt sau lần đăng nhập thành công đầu tiên.

## 6. Đường dẫn chính

```text
/                         Trang chủ
/san-bong                 Tìm sân
/dang-nhap                Đăng nhập
/dang-ky                  Đăng ký
/lich-su-dat-san          Booking của khách
/chu-san                  Dashboard chủ sân
/admin                    Dashboard Admin
/api/health               Health check
```

## 7. Tài liệu

- `docs/API.md`
- `docs/Database.md`
- `docs/UserGuide.md`
- `docs/Deployment.md`
- `docs/TestPlan.md`
- `docs/Security.md`
- `docs/Part09-Finalization.md`

## 8. Sơ đồ

- `diagrams/ERD.png`
- `diagrams/UseCase.png`
- `diagrams/Architecture.png`
- `diagrams/SequenceBooking.png`

## 9. Ảnh sân

Project chạy với SVG mặc định. Chủ sân có thể upload JPG/PNG/WebP tối đa 5 MB; ảnh runtime nằm trong `public/uploads/pitches/` và không được commit vào Git.

## Production

Xem `docs/Deployment.md` và `docs/Security.md`. Production yêu cầu HTTPS, `SESSION_SECRET` mạnh và `DB_PASSWORD` không rỗng.
