-- =====================================================
-- 06_queries.sql
-- PostgreSQL - 30 cau truy van cho he thong quan ly dat san bong
-- Chay sau:
--   01_schema.sql
--   02_seed.sql
--   03_functions.sql
--   04_triggers.sql
--   05_views.sql
-- =====================================================

-- =====================================================
-- NHOM 1: TAI KHOAN & KHACH HANG
-- =====================================================

-- Cau 1. Dang ky tai khoan khach hang moi
INSERT INTO tai_khoan (
    ma_tai_khoan, ten_dang_nhap, mat_khau, vai_tro, trang_thai
)
VALUES (
    'TK_Q01', 'khach_test01', '123456', 'Khach hang', 'Hoat dong'
)
ON CONFLICT (ma_tai_khoan) DO NOTHING;

INSERT INTO khach_hang (
    ma_khach_hang, ho_va_ten, sdt, ma_tai_khoan
)
VALUES (
    'KH_Q01', 'Khach Hang Test', '0900000001', 'TK_Q01'
)
ON CONFLICT (ma_khach_hang) DO NOTHING;


-- Cau 2. Dang nhap tai khoan bang fn_dang_nhap
SELECT *
FROM fn_dang_nhap('khach01', '123456');


-- Cau 3. Cap nhat so dien thoai khach hang
UPDATE khach_hang
SET sdt = '0911111111'
WHERE ma_khach_hang = 'KH01';

SELECT ma_khach_hang, ho_va_ten, sdt
FROM khach_hang
WHERE ma_khach_hang = 'KH01';


-- Cau 4. Doi mat khau tai khoan
UPDATE tai_khoan
SET mat_khau = '654321'
WHERE ma_tai_khoan = 'TK_Q01';

SELECT ma_tai_khoan, ten_dang_nhap, mat_khau
FROM tai_khoan
WHERE ma_tai_khoan = 'TK_Q01';


-- Cau 5. Xem lich su dat san cua 1 khach hang
SELECT 
    ds.ma_dat_san,
    ds.ngay_dat,
    sb.ten_san,
    kg.gio_bat_dau,
    kg.gio_ket_thuc,
    ds.trang_thai_dat,
    ds.tien_san
FROM dat_san ds
JOIN san_bong sb
    ON ds.ma_san = sb.ma_san
JOIN khung_gio kg
    ON ds.ma_khung_gio = kg.ma_khung_gio
WHERE ds.ma_khach_hang = 'KH01'
ORDER BY ds.ngay_dat DESC;


-- Cau 6. Top 10 khach hang chi tieu nhieu nhat
SELECT
    kh.ma_khach_hang,
    kh.ho_va_ten,
    kh.sdt,
    SUM(tt.tong_tien) AS tong_chi_tieu
FROM khach_hang kh
JOIN dat_san ds
    ON kh.ma_khach_hang = ds.ma_khach_hang
JOIN thanh_toan tt
    ON ds.ma_dat_san = tt.ma_dat_san
WHERE tt.trang_thai_thanh_toan = 'Da thanh toan'
GROUP BY kh.ma_khach_hang, kh.ho_va_ten, kh.sdt
ORDER BY tong_chi_tieu DESC
LIMIT 10;


-- Cau 7. Phan loai khach hang theo tong chi tieu
SELECT
    kh.ma_khach_hang,
    kh.ho_va_ten,
    kh.sdt,
    COALESCE(SUM(tt.tong_tien), 0) AS tong_chi_tieu,
    CASE
        WHEN COALESCE(SUM(tt.tong_tien), 0) >= 2000000 THEN 'VIP'
        WHEN COALESCE(SUM(tt.tong_tien), 0) >= 500000 THEN 'Than thiet'
        ELSE 'Tiem nang'
    END AS loai_khach_hang
FROM khach_hang kh
LEFT JOIN dat_san ds
    ON kh.ma_khach_hang = ds.ma_khach_hang
LEFT JOIN thanh_toan tt
    ON ds.ma_dat_san = tt.ma_dat_san
   AND tt.trang_thai_thanh_toan = 'Da thanh toan'
GROUP BY kh.ma_khach_hang, kh.ho_va_ten, kh.sdt
ORDER BY tong_chi_tieu DESC;


-- =====================================================
-- NHOM 2: SAN BONG & DICH VU
-- =====================================================

-- Cau 8. Them san bong moi bang fn_them_san_bong
DELETE FROM san_bong
WHERE ma_san = 'S_TEST08';

SELECT fn_them_san_bong(
    'S_TEST08',
    'San test 08',
    'Dia chi test',
    'San 5 nguoi',
    200000,
    'CS01',
    'KV01'
);


-- Cau 9. Ngung hoat dong san bang fn_xoa_san_bong
SELECT fn_xoa_san_bong('S_TEST08');

SELECT ma_san, ten_san, trang_thai
FROM san_bong
WHERE ma_san = 'S_TEST08';


-- Cau 10. Cap nhat gia thue san
UPDATE san_bong
SET gia_thue = 250000
WHERE ma_san = 'S01';

SELECT ma_san, ten_san, gia_thue
FROM san_bong
WHERE ma_san = 'S01';


-- Cau 11. Tim san theo khu vuc
SELECT
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    sb.dia_chi,
    sb.gia_thue,
    kv.ten_khu_vuc,
    kv.quan_huyen
FROM san_bong sb
JOIN khu_vuc kv
    ON sb.ma_khu_vuc = kv.ma_khu_vuc
WHERE kv.ma_khu_vuc = 'KV01'
  AND sb.trang_thai = 'Hoat dong';


-- Cau 12. Tim san theo loai san
SELECT
    ma_san,
    ten_san,
    dia_chi,
    gia_thue,
    trang_thai
FROM san_bong
WHERE loai_san = 'San 5 nguoi'
  AND trang_thai = 'Hoat dong';


-- Cau 13. Tim san con trong theo ngay va khung gio
SELECT
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    sb.dia_chi,
    sb.gia_thue
FROM san_bong sb
WHERE sb.trang_thai = 'Hoat dong'
  AND NOT EXISTS (
      SELECT 1
      FROM dat_san ds
      WHERE ds.ma_san = sb.ma_san
        AND ds.ngay_dat = DATE '2026-09-01'
        AND ds.ma_khung_gio = 'KG01'
        AND ds.trang_thai_dat <> 'Da huy'
  );


-- Cau 14. Liet ke dich vu hien co
SELECT
    ma_dich_vu,
    ten_dv,
    don_gia
FROM dich_vu
ORDER BY ten_dv;


-- Cau 15. Cap nhat gia dich vu
UPDATE dich_vu
SET don_gia = 15000
WHERE ma_dich_vu = 'DV01';

SELECT ma_dich_vu, ten_dv, don_gia
FROM dich_vu
WHERE ma_dich_vu = 'DV01';


-- =====================================================
-- NHOM 3: DAT SAN & THANH TOAN
-- =====================================================

-- Cau 16. Dat san moi bang fn_dat_san_bong
DELETE FROM chi_tiet_dich_vu WHERE ma_dat_san = 'DS_Q16';
DELETE FROM thanh_toan WHERE ma_dat_san = 'DS_Q16';
DELETE FROM dat_san WHERE ma_dat_san = 'DS_Q16';

SELECT fn_dat_san_bong(
    'DS_Q16',
    'KH01',
    'S01',
    'KG01',
    DATE '2026-09-01'
);

SELECT *
FROM dat_san
WHERE ma_dat_san = 'DS_Q16';


-- Cau 17. Huy don dat san
DELETE FROM chi_tiet_dich_vu WHERE ma_dat_san = 'DS_Q17';
DELETE FROM thanh_toan WHERE ma_dat_san = 'DS_Q17';
DELETE FROM dat_san WHERE ma_dat_san = 'DS_Q17';

SELECT fn_dat_san_bong('DS_Q17', 'KH01', 'S01', 'KG02', DATE '2026-09-01');

SELECT fn_huy_don_dat_san('DS_Q17');

SELECT ma_dat_san, trang_thai_dat
FROM dat_san
WHERE ma_dat_san = 'DS_Q17';


-- Cau 18. Xac nhan don dat san
DELETE FROM chi_tiet_dich_vu WHERE ma_dat_san = 'DS_Q18';
DELETE FROM thanh_toan WHERE ma_dat_san = 'DS_Q18';
DELETE FROM dat_san WHERE ma_dat_san = 'DS_Q18';

SELECT fn_dat_san_bong('DS_Q18', 'KH01', 'S01', 'KG03', DATE '2026-09-01');

SELECT fn_xac_nhan_don_dat_san('DS_Q18');

SELECT ma_dat_san, trang_thai_dat
FROM dat_san
WHERE ma_dat_san = 'DS_Q18';


-- Cau 19. Them dich vu vao don dat san
SELECT fn_them_dich_vu_cho_don('DS_Q18', 'DV01', 3);

SELECT *
FROM chi_tiet_dich_vu
WHERE ma_dat_san = 'DS_Q18';


-- Cau 20. Xem chi tiet dich vu cua mot don dat san
SELECT
    ct.ma_dat_san,
    dv.ma_dich_vu,
    dv.ten_dv,
    ct.so_luong,
    ct.don_gia,
    ct.thanh_tien
FROM chi_tiet_dich_vu ct
JOIN dich_vu dv
    ON ct.ma_dich_vu = dv.ma_dich_vu
WHERE ct.ma_dat_san = 'DS_Q18';


-- Cau 21. Kiem tra trigger tu tao hoa don thanh toan cho don dat san
DELETE FROM chi_tiet_dich_vu WHERE ma_dat_san = 'DS_Q21';
DELETE FROM thanh_toan WHERE ma_dat_san = 'DS_Q21';
DELETE FROM dat_san WHERE ma_dat_san = 'DS_Q21';

SELECT fn_dat_san_bong('DS_Q21', 'KH01', 'S01', 'KG04', DATE '2026-09-01');

SELECT *
FROM thanh_toan
WHERE ma_dat_san = 'DS_Q21';


-- Cau 22. Thanh toan hoa don
SELECT fn_thanh_toan_hoa_don('DS_Q21');

SELECT ma_thanh_toan, ma_dat_san, tong_tien, trang_thai_thanh_toan
FROM thanh_toan
WHERE ma_dat_san = 'DS_Q21';


-- Cau 23. Xem chi tiet hoa don cua mot don dat san
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
    ON ds.ma_dat_san = tt.ma_dat_san
WHERE ds.ma_dat_san = 'DS_Q21';


-- =====================================================
-- NHOM 4: BAO CAO & THONG KE
-- =====================================================

-- Cau 24. View doanh thu theo san
SELECT *
FROM v_doanh_thu_theo_san
ORDER BY tong_doanh_thu DESC;


-- Cau 25. Thong ke doanh thu theo ngay, theo tung san
DROP VIEW IF EXISTS v_doanh_thu_theo_ngay_tung_san;

CREATE VIEW v_doanh_thu_theo_ngay_tung_san AS
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
    sb.dia_chi

ORDER BY
    ds.ngay_dat,
    sb.ma_san;
--Vd : SELECT *
-- FROM v_doanh_thu_theo_ngay_tung_san
--WHERE ma_san = 'S01'
--AND ngay_dat = DATE '2026-06-03';



-- Cau 26. Thong ke doanh thu theo thang
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
GROUP BY DATE_TRUNC('month', ds.ngay_dat)
ORDER BY thang;


-- Cau 27. Thong ke khung gio duoc dat nhieu nhat theo tung san, chi tinh cac don da xac nhan hoac da thanh toan
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
WHERE kg.la_gio_diem = TRUE
AND ds.trang_thai_dat = 'Da xac nhan'
AND sb.trang_thai = 'Hoat dong'
GROUP BY
sb.ma_san,
sb.ten_san,
sb.loai_san,
kg.ma_khung_gio,
kg.gio_bat_dau,
kg.gio_ket_thuc
ORDER BY
sb.ma_san,
so_luot_dat DESC;



-- Cau 28. thong ke cac dich vu ban chay trong mot khoang thoi gian, chi tinh cac don dat san da xac nhan va da thanh toan
SELECT
    dv.ma_dich_vu,
    dv.ten_dv,
    dv.don_gia,

    SUM(ct.so_luong) AS tong_so_luong_ban,
    COUNT(ct.ma_dat_san) AS so_don_su_dung_dich_vu,
    SUM(ct.so_luong * ct.don_gia) AS doanh_thu_dich_vu

FROM chi_tiet_dich_vu ct
JOIN dich_vu dv
    ON ct.ma_dich_vu = dv.ma_dich_vu
JOIN dat_san ds
    ON ct.ma_dat_san = ds.ma_dat_san
JOIN thanh_toan tt
    ON ds.ma_dat_san = tt.ma_dat_san

WHERE ds.trang_thai_dat = 'Da xac nhan'
  AND tt.trang_thai_thanh_toan = 'Da thanh toan'
  AND ds.ngay_dat BETWEEN DATE '2026-06-01' AND DATE '2026-06-30'

GROUP BY
    dv.ma_dich_vu,
    dv.ten_dv,
    dv.don_gia

ORDER BY
    tong_so_luong_ban DESC,
    doanh_thu_dich_vu DESC;



-- Cau 29. Thong ke doanh thu theo khu vuc
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
    kv.quan_huyen
ORDER BY tong_doanh_thu DESC;


-- Cau 30. Tinh ty le huy san
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
WHERE ds.trang_thai_dat = 'Da huy'
ORDER BY
ds.ngay_dat,
sb.ma_san;
-- Cau 31 : thong ke don chua thanh toan
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
  AND ds.trang_thai_dat <> 'Da huy'

ORDER BY
    ds.ngay_dat,
    sb.ma_san;
