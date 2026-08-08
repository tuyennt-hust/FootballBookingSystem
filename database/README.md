# Database

Thư mục chứa toàn bộ mã PostgreSQL của FootballBookingSystem.

## Khởi tạo database mới

```powershell
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/01_schema.sql
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/02_seed.sql
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/03_functions.sql
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/04_triggers.sql
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/05_views.sql
```

## Vai trò file

| File | Nội dung |
|---|---|
| `01_schema.sql` | Bảng, PK/FK, CHECK, index |
| `02_seed.sql` | Dữ liệu mẫu |
| `03_functions.sql` | Business functions + `pgcrypto` |
| `04_triggers.sql` | Trigger function + trigger |
| `05_views.sql` | View vận hành/báo cáo |
| `06_queries.sql` | 30+ truy vấn minh họa; có thao tác thay đổi dữ liệu |
| `07_big_data.sql` | Sinh dữ liệu lớn và kiểm thử hiệu năng |

Không chạy `06_queries.sql`/`07_big_data.sql` khi chỉ muốn khởi tạo web.

## Migration

Project nâng cấp từ trước Phần 6 chạy một lần:

```powershell
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/migrations/001_add_pitch_image_url.sql
```

Database tạo mới bằng `01_schema.sql` đã có `image_url` nên không cần migration này.

## Final integrity check

```powershell
npm run db:check
```

hoặc:

```powershell
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f tests/database/final_smoke_test.sql
```

Xem mô tả đầy đủ tại `docs/Database.md` và `diagrams/ERD.png`.
