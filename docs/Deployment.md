# Deployment Guide

## Yêu cầu

- Node.js 20+ (khuyến nghị LTS).
- PostgreSQL 15+.
- HTTPS khi chạy production.

## 1. Cài dependency

```bash
npm ci
```

Nếu chưa có `package-lock.json`, chạy `npm install` một lần và commit lockfile sau khi xác nhận dependency.

## 2. Cấu hình environment

Sao chép `.env.example` thành `.env` và sửa:

```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dat_san_bong
DB_USER=football_app
DB_PASSWORD=<mat-khau-manh>
SESSION_SECRET=<chuoi-ngau-nhien-toi-thieu-32-ky-tu>
SESSION_COOKIE_NAME=football.sid
SESSION_MAX_AGE_MS=28800000
```

Không commit `.env`.

## 3. Database

Database mới:

```bash
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/01_schema.sql
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/02_seed.sql
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/03_functions.sql
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/04_triggers.sql
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/05_views.sql
```

Nếu đi từ bản project cũ chưa có ảnh sân, chạy migration:

```bash
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f database/migrations/001_add_pitch_image_url.sql
```

## 4. Pre-deploy checks

```bash
npm run check
npm run db:check
```

Không deploy nếu một trong hai lệnh thất bại.

## 5. Chạy ứng dụng

```bash
npm start
```

Đặt Node.js sau Nginx/Caddy/Apache hoặc reverse proxy tương đương và terminate TLS ở proxy.

## Docker PostgreSQL cho môi trường local

```bash
docker compose up -d
```

`docker-compose.yml` trong project chỉ dựng PostgreSQL; ứng dụng Node.js vẫn chạy bằng `npm run dev`/`npm start`.

## Dữ liệu cần backup

- PostgreSQL database.
- `public/uploads/pitches/` nếu dùng ảnh sân thật.
- `.env` nên được lưu bằng secret manager hoặc nơi an toàn, không đặt trong source control.
