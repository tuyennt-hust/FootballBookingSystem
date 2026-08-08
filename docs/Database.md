# Database Documentation

PostgreSQL database: `dat_san_bong`.

## Thứ tự khởi tạo

```text
01_schema.sql
→ 02_seed.sql
→ 03_functions.sql
→ 04_triggers.sql
→ 05_views.sql
```

Không chạy `06_queries.sql` và `07_big_data.sql` trong quá trình khởi tạo thông thường vì hai file này dùng cho truy vấn minh họa/kiểm thử.

## 1. Các bảng chính

| Bảng | Vai trò |
|---|---|
| `tai_khoan` | Đăng nhập, vai trò và trạng thái tài khoản |
| `khach_hang` | Hồ sơ khách hàng, quan hệ 1-1 với tài khoản khách |
| `chu_san` | Hồ sơ chủ sân, quan hệ 1-1 với tài khoản chủ sân |
| `khu_vuc` | Khu vực/quận huyện |
| `khung_gio` | Các ca giờ cố định và cờ giờ điểm |
| `dich_vu` | Catalog dịch vụ và đơn giá |
| `san_bong` | Thông tin sân, giá, trạng thái, chủ sân, khu vực, ảnh |
| `dat_san` | Đơn đặt sân theo khách, sân, ngày và khung giờ |
| `thanh_toan` | Hóa đơn 1-1 với đơn đặt sân |
| `chi_tiet_dich_vu` | Bảng nối N-N giữa đơn và dịch vụ |

`web_session` không nằm trong `01_schema.sql`; bảng này do `connect-pg-simple` tự tạo khi web chạy.

## 2. Quan hệ

- `tai_khoan 1 - 0..1 khach_hang`
- `tai_khoan 1 - 0..1 chu_san`
- `chu_san 1 - N san_bong`
- `khu_vuc 1 - N san_bong`
- `san_bong 1 - N dat_san`
- `khach_hang 1 - N dat_san`
- `khung_gio 1 - N dat_san`
- `dat_san 1 - 1 thanh_toan`
- `dat_san N - N dich_vu` qua `chi_tiet_dich_vu`

Xem `diagrams/ERD.png`.

## 3. Business functions

Các function quan trọng trong `03_functions.sql`:

### Tài khoản

- `fn_dang_ky_khach_hang`
- `fn_dang_nhap`
- `fn_cap_nhat_sdt_khach_hang`
- `fn_doi_mat_khau_tai_khoan`

### Báo cáo khách hàng

- `fn_lich_su_dat_san`
- `fn_top_10_khach_hang_chi_tieu`
- `fn_phan_loai_khach_hang`

### Sân

- `fn_them_san_bong`
- `fn_xoa_san_bong`

### Booking/payment

- `fn_dat_san_bong`
- `fn_huy_don_dat_san`
- `fn_xac_nhan_don_dat_san`
- `fn_them_dich_vu_cho_don`
- `fn_thanh_toan_hoa_don`

Node.js không tự viết lại các quy tắc tính tiền đã có trong database; service/repository gọi function và đọc kết quả.

## 4. Triggers

`04_triggers.sql` chứa 5 trigger chính:

| Trigger | Thời điểm | Mục đích |
|---|---|---|
| `tg_kiem_tra_trung_lich` | BEFORE INSERT/UPDATE `dat_san` | Chặn hai đơn hoạt động cùng sân/ngày/khung giờ |
| `tg_tinh_tien_san` | AFTER thay đổi booking | Tính tiền sân theo giá thường/giờ điểm |
| `tg_tao_hoa_don` | AFTER tạo booking | Tạo hóa đơn tương ứng |
| `tg_tinh_tien_chi_tiet_dich_vu` | BEFORE ghi chi tiết dịch vụ | Tính `thanh_tien = so_luong * don_gia` |
| `tg_cap_nhat_tien_dich_vu` | AFTER thay đổi chi tiết dịch vụ | Đồng bộ tổng dịch vụ/tổng hóa đơn |

## 5. Views

Các view dùng trực tiếp cho báo cáo và màn hình quản trị:

- `v_lich_dat_san_chi_tiet`
- `v_doanh_thu_theo_san`
- `v_doanh_thu_theo_ngay`
- `v_doanh_thu_theo_ngay_tung_san`
- `v_doanh_thu_theo_thang`
- `v_doanh_thu_theo_khu_vuc`
- `v_khung_gio_duoc_dat_nhieu`
- `v_dich_vu_ban_chay`
- `v_san_it_dat`
- `v_don_chua_thanh_toan`
- `v_don_bi_huy`
- `v_ty_le_huy_san`
- `v_chi_tiet_hoa_don`

## 6. Index

Schema hiện có index phục vụ các truy vấn thường xuyên:

- `dat_san(ma_san)`
- `dat_san(ma_khach_hang)`
- `dat_san(ngay_dat, ma_khung_gio)`
- `san_bong(ma_khu_vuc)`
- `san_bong(loai_san)`
- `thanh_toan(trang_thai_thanh_toan)`

## 7. Transaction và chống race condition

Ngoài trigger kiểm tra trùng lịch, Node.js sử dụng `pg_advisory_xact_lock` trong transaction khi:

- tạo booking theo slot;
- tạo mã booking/sân/khu vực;
- hủy booking;
- thêm/xóa dịch vụ;
- thanh toán hóa đơn.

Mục đích là tránh hai request đồng thời cùng vượt qua kiểm tra trước khi commit.

## 8. Migration

Migration hiện tại:

```text
database/migrations/001_add_pitch_image_url.sql
```

Bổ sung `san_bong.image_url` cho project nâng cấp từ bản trước Phần 6. File `01_schema.sql` cuối đã chứa cột này sẵn cho database tạo mới.

## 9. Kiểm tra bất biến cuối

```powershell
npm run db:check
```

hoặc:

```powershell
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f tests/database/final_smoke_test.sql
```
