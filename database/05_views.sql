-- =====================================================
-- 05_views.sql
-- PostgreSQL - View hoan chinh cho QuanLySanBong
-- Chay sau:
--   01_schema.sql
--   02_seed.sql
--   03_functions.sql
--   04_triggers.sql
-- =====================================================

DROP VIEW IF EXISTS v_chi_tiet_hoa_don;
DROP VIEW IF EXISTS v_ty_le_huy_san;
DROP VIEW IF EXISTS v_don_bi_huy;
DROP VIEW IF EXISTS v_don_chua_thanh_toan;
DROP VIEW IF EXISTS v_san_it_dat;
DROP VIEW IF EXISTS v_dich_vu_ban_chay;
DROP VIEW IF EXISTS v_khung_gio_duoc_dat_nhieu;
DROP VIEW IF EXISTS v_doanh_thu_theo_thang;
DROP VIEW IF EXISTS v_doanh_thu_theo_ngay_tung_san;
DROP VIEW IF EXISTS v_doanh_thu_theo_ngay;
DROP VIEW IF EXISTS v_doanh_thu_theo_khu_vuc;
DROP VIEW IF EXISTS v_doanh_thu_theo_san;
DROP VIEW IF EXISTS v_lich_dat_san_chi_tiet;
DROP VIEW IF EXISTS v_trang_thai_san_hien_tai;

-- =====================================================
-- 1. View lich dat san chi tiet
-- =====================================================

CREATE OR REPLACE VIEW v_lich_dat_san_chi_tiet AS
SELECT
    ds.ma_dat_san,
    ds.ngay_dat,
    kg.ma_khung_gio,
    kg.gio_bat_dau,
    kg.gio_ket_thuc,
    kh.ma_khach_hang,
    kh.ho_va_ten AS ten_khach_hang,
    kh.sdt,
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    sb.dia_chi,
    kv.ma_khu_vuc,
    kv.ten_khu_vuc,
    kv.quan_huyen,
    ds.trang_thai_dat,
    ds.tien_san,
    tt.ma_thanh_toan,
    tt.tong_tien_san,
    tt.tong_tien_dich_vu,
    tt.tong_tien,
    tt.trang_thai_thanh_toan
FROM dat_san ds
JOIN khach_hang kh
    ON ds.ma_khach_hang = kh.ma_khach_hang
JOIN san_bong sb
    ON ds.ma_san = sb.ma_san
JOIN khu_vuc kv
    ON sb.ma_khu_vuc = kv.ma_khu_vuc
JOIN khung_gio kg
    ON ds.ma_khung_gio = kg.ma_khung_gio
JOIN thanh_toan tt
    ON ds.ma_dat_san = tt.ma_dat_san;

-- =====================================================
-- 2. View doanh thu theo san
-- =====================================================

CREATE OR REPLACE VIEW v_doanh_thu_theo_san AS
SELECT
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    sb.dia_chi,
    COUNT(ds.ma_dat_san) AS so_luot_dat,
    SUM(tt.tong_tien_san) AS doanh_thu_tien_san,
    SUM(tt.tong_tien_dich_vu) AS doanh_thu_dich_vu,
    SUM(tt.tong_tien) AS tong_doanh_thu
FROM san_bong sb
JOIN dat_san ds
    ON sb.ma_san = ds.ma_san
JOIN thanh_toan tt
    ON ds.ma_dat_san = tt.ma_dat_san
WHERE tt.trang_thai_thanh_toan = 'Da thanh toan'
  AND ds.trang_thai_dat <> 'Da huy'
GROUP BY
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    sb.dia_chi;

-- =====================================================
-- 3. View doanh thu theo ngay
-- =====================================================

CREATE OR REPLACE VIEW v_doanh_thu_theo_ngay AS
SELECT
    ds.ngay_dat,
    COUNT(ds.ma_dat_san) AS so_luot_dat,
    SUM(tt.tong_tien_san) AS doanh_thu_tien_san,
    SUM(tt.tong_tien_dich_vu) AS doanh_thu_dich_vu,
    SUM(tt.tong_tien) AS tong_doanh_thu
FROM dat_san ds
JOIN thanh_toan tt
    ON ds.ma_dat_san = tt.ma_dat_san
WHERE tt.trang_thai_thanh_toan = 'Da thanh toan'
  AND ds.trang_thai_dat <> 'Da huy'
GROUP BY ds.ngay_dat;

-- =====================================================
-- 4. View doanh thu theo ngay tung san
-- =====================================================

CREATE OR REPLACE VIEW v_doanh_thu_theo_ngay_tung_san AS
SELECT
    ds.ngay_dat,
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    sb.dia_chi,
    COUNT(ds.ma_dat_san) AS so_luot_dat,
    SUM(tt.tong_tien_san) AS doanh_thu_tien_san,
    SUM(tt.tong_tien_dich_vu) AS doanh_thu_dich_vu,
    SUM(tt.tong_tien) AS tong_doanh_thu
FROM dat_san ds
JOIN san_bong sb
    ON ds.ma_san = sb.ma_san
JOIN thanh_toan tt
    ON ds.ma_dat_san = tt.ma_dat_san
WHERE tt.trang_thai_thanh_toan = 'Da thanh toan'
  AND ds.trang_thai_dat <> 'Da huy'
GROUP BY
    ds.ngay_dat,
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    sb.dia_chi;

-- =====================================================
-- 5. View doanh thu theo thang
-- =====================================================

CREATE OR REPLACE VIEW v_doanh_thu_theo_thang AS
SELECT
    DATE_TRUNC('month', ds.ngay_dat)::DATE AS thang,
    COUNT(ds.ma_dat_san) AS so_luot_dat,
    SUM(tt.tong_tien_san) AS doanh_thu_tien_san,
    SUM(tt.tong_tien_dich_vu) AS doanh_thu_dich_vu,
    SUM(tt.tong_tien) AS tong_doanh_thu
FROM dat_san ds
JOIN thanh_toan tt
    ON ds.ma_dat_san = tt.ma_dat_san
WHERE tt.trang_thai_thanh_toan = 'Da thanh toan'
  AND ds.trang_thai_dat <> 'Da huy'
GROUP BY DATE_TRUNC('month', ds.ngay_dat);

-- =====================================================
-- 6. View doanh thu theo khu vuc
-- =====================================================

CREATE OR REPLACE VIEW v_doanh_thu_theo_khu_vuc AS
SELECT
    kv.ma_khu_vuc,
    kv.ten_khu_vuc,
    kv.quan_huyen,
    COUNT(DISTINCT sb.ma_san) AS so_luong_san,
    COUNT(ds.ma_dat_san) AS so_luot_dat,
    SUM(tt.tong_tien_san) AS doanh_thu_tien_san,
    SUM(tt.tong_tien_dich_vu) AS doanh_thu_dich_vu,
    SUM(tt.tong_tien) AS tong_doanh_thu
FROM khu_vuc kv
JOIN san_bong sb
    ON kv.ma_khu_vuc = sb.ma_khu_vuc
JOIN dat_san ds
    ON sb.ma_san = ds.ma_san
JOIN thanh_toan tt
    ON ds.ma_dat_san = tt.ma_dat_san
WHERE tt.trang_thai_thanh_toan = 'Da thanh toan'
  AND ds.trang_thai_dat <> 'Da huy'
GROUP BY
    kv.ma_khu_vuc,
    kv.ten_khu_vuc,
    kv.quan_huyen;

-- =====================================================
-- 7. View khung gio duoc dat nhieu
-- =====================================================

CREATE OR REPLACE VIEW v_khung_gio_duoc_dat_nhieu AS
SELECT
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    kg.ma_khung_gio,
    kg.gio_bat_dau,
    kg.gio_ket_thuc,
    COUNT(ds.ma_dat_san) AS so_luot_dat
FROM san_bong sb
JOIN dat_san ds
    ON sb.ma_san = ds.ma_san
JOIN khung_gio kg
    ON ds.ma_khung_gio = kg.ma_khung_gio
WHERE ds.trang_thai_dat = 'Da xac nhan'
GROUP BY
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    kg.ma_khung_gio,
    kg.gio_bat_dau,
    kg.gio_ket_thuc;

-- =====================================================
-- 8. View dich vu ban chay
-- =====================================================

CREATE OR REPLACE VIEW v_dich_vu_ban_chay AS
SELECT
    dv.ma_dich_vu,
    dv.ten_dv,
    dv.don_gia,
    SUM(ct.so_luong) AS tong_so_luong_ban,
    COUNT(ct.ma_dat_san) AS so_don_su_dung,
    SUM(ct.thanh_tien) AS doanh_thu_dich_vu
FROM chi_tiet_dich_vu ct
JOIN dich_vu dv
    ON ct.ma_dich_vu = dv.ma_dich_vu
JOIN dat_san ds
    ON ct.ma_dat_san = ds.ma_dat_san
JOIN thanh_toan tt
    ON ds.ma_dat_san = tt.ma_dat_san
WHERE ds.trang_thai_dat = 'Da xac nhan'
  AND tt.trang_thai_thanh_toan = 'Da thanh toan'
GROUP BY
    dv.ma_dich_vu,
    dv.ten_dv,
    dv.don_gia;

-- =====================================================
-- 9. View san it dat
-- =====================================================

CREATE OR REPLACE VIEW v_san_it_dat AS
SELECT
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    sb.dia_chi,
    sb.trang_thai,
    COUNT(ds.ma_dat_san) AS so_luot_dat
FROM san_bong sb
LEFT JOIN dat_san ds
    ON sb.ma_san = ds.ma_san
   AND ds.trang_thai_dat = 'Da xac nhan'
WHERE sb.trang_thai = 'Hoat dong'
GROUP BY
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    sb.dia_chi,
    sb.trang_thai;

-- =====================================================
-- 10. View don chua thanh toan
-- =====================================================

CREATE OR REPLACE VIEW v_don_chua_thanh_toan AS
SELECT
    ds.ma_dat_san,
    ds.ngay_dat,
    kh.ma_khach_hang,
    kh.ho_va_ten AS ten_khach_hang,
    kh.sdt,
    sb.ma_san,
    sb.ten_san,
    kg.gio_bat_dau,
    kg.gio_ket_thuc,
    tt.tong_tien_san,
    tt.tong_tien_dich_vu,
    tt.tong_tien,
    tt.trang_thai_thanh_toan
FROM thanh_toan tt
JOIN dat_san ds
    ON tt.ma_dat_san = ds.ma_dat_san
JOIN khach_hang kh
    ON ds.ma_khach_hang = kh.ma_khach_hang
JOIN san_bong sb
    ON ds.ma_san = sb.ma_san
JOIN khung_gio kg
    ON ds.ma_khung_gio = kg.ma_khung_gio
WHERE tt.trang_thai_thanh_toan = 'Chua thanh toan'
  AND ds.trang_thai_dat <> 'Da huy';

-- =====================================================
-- 11. View don bi huy
-- =====================================================

CREATE OR REPLACE VIEW v_don_bi_huy AS
SELECT
    ds.ma_dat_san,
    ds.ngay_dat,
    kh.ma_khach_hang,
    kh.ho_va_ten AS ten_khach_hang,
    kh.sdt,
    sb.ma_san,
    sb.ten_san,
    kg.gio_bat_dau,
    kg.gio_ket_thuc,
    ds.trang_thai_dat
FROM dat_san ds
JOIN khach_hang kh
    ON ds.ma_khach_hang = kh.ma_khach_hang
JOIN san_bong sb
    ON ds.ma_san = sb.ma_san
JOIN khung_gio kg
    ON ds.ma_khung_gio = kg.ma_khung_gio
WHERE ds.trang_thai_dat = 'Da huy';

-- =====================================================
-- 12. View ty le huy san
-- =====================================================

CREATE OR REPLACE VIEW v_ty_le_huy_san AS
SELECT
    COUNT(*) AS tong_so_don,
    SUM(CASE WHEN trang_thai_dat = 'Da huy' THEN 1 ELSE 0 END) AS so_don_huy,
    ROUND(
        SUM(CASE WHEN trang_thai_dat = 'Da huy' THEN 1 ELSE 0 END)::NUMERIC
        * 100 / COUNT(*),
        2
    ) AS ty_le_huy_phan_tram
FROM dat_san;

-- =====================================================
-- 13. View chi tiet hoa don
-- =====================================================

CREATE OR REPLACE VIEW v_chi_tiet_hoa_don AS
SELECT
    ds.ma_dat_san,
    kh.ho_va_ten AS ten_khach_hang,
    sb.ten_san,
    ds.ngay_dat,
    kg.gio_bat_dau,
    kg.gio_ket_thuc,
    ds.trang_thai_dat,
    tt.ma_thanh_toan,
    tt.tong_tien_san,
    tt.tong_tien_dich_vu,
    tt.tong_tien,
    tt.trang_thai_thanh_toan
FROM dat_san ds
JOIN khach_hang kh
    ON ds.ma_khach_hang = kh.ma_khach_hang
JOIN san_bong sb
    ON ds.ma_san = sb.ma_san
JOIN khung_gio kg
    ON ds.ma_khung_gio = kg.ma_khung_gio
JOIN thanh_toan tt
    ON ds.ma_dat_san = tt.ma_dat_san;

-- =====================================================
-- 14. View trang thai san hien tai
-- =====================================================

CREATE OR REPLACE VIEW v_trang_thai_san_hien_tai AS
SELECT
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    sb.trang_thai AS trang_thai_van_hanh,
    CASE
        WHEN sb.trang_thai = 'Bao tri' THEN 'Bao tri'
        WHEN sb.trang_thai = 'Ngung hoat dong' THEN 'Ngung hoat dong'
        WHEN EXISTS (
            SELECT 1
            FROM dat_san ds
            JOIN khung_gio kg
                ON ds.ma_khung_gio = kg.ma_khung_gio
            WHERE ds.ma_san = sb.ma_san
              AND ds.ngay_dat = CURRENT_DATE
              AND ds.trang_thai_dat = 'Da xac nhan'
              AND CURRENT_TIME BETWEEN kg.gio_bat_dau AND kg.gio_ket_thuc
        ) THEN 'Dang su dung'
        ELSE 'Dang trong'
    END AS trang_thai_hien_tai
FROM san_bong sb;
