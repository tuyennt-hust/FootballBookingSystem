-- =====================================================
-- 07_big_data.sql
-- Kiem thu kha nang mo rong voi du lieu lon
-- Tao them khoang 100 san bong va 5.000 don dat san
--
-- Chay sau:
--   01_schema.sql
--   02_seed.sql
--   03_functions.sql
--   04_triggers.sql
--   05_views.sql
--
-- Lenh chay:
-- psql -U postgres -d dat_san_bong -f database\07_big_data.sql
-- =====================================================

\timing on

-- 1. Kiem tra function can thiet
DO $$
BEGIN
    IF to_regprocedure('fn_dat_san_bong(character varying, character varying, character varying, character varying, date)') IS NULL THEN
        RAISE EXCEPTION 'Chua co function fn_dat_san_bong. Hay chay file 03_functions.sql
--   04_triggers.sql truoc.';
    END IF;

    IF to_regprocedure('fn_them_dich_vu_cho_don(character varying, character varying, integer)') IS NULL THEN
        RAISE EXCEPTION 'Chua co function fn_them_dich_vu_cho_don. Hay chay file 03_functions.sql
--   04_triggers.sql truoc.';
    END IF;
END;
$$;

-- 2. Them index ho tro du lieu lon
CREATE INDEX IF NOT EXISTS idx_dat_san_lich
ON dat_san(ma_san, ngay_dat, ma_khung_gio, trang_thai_dat);

CREATE INDEX IF NOT EXISTS idx_dat_san_ngay
ON dat_san(ngay_dat);

CREATE INDEX IF NOT EXISTS idx_thanh_toan_trang_thai_ma_dat_san
ON thanh_toan(trang_thai_thanh_toan, ma_dat_san);

CREATE INDEX IF NOT EXISTS idx_chi_tiet_dich_vu_ma_dich_vu
ON chi_tiet_dich_vu(ma_dich_vu);

-- 3. Xoa du lieu test cu neu co
DELETE FROM chi_tiet_dich_vu
WHERE ma_dat_san LIKE 'DS_BIG_%';

DELETE FROM thanh_toan
WHERE ma_dat_san LIKE 'DS_BIG_%';

DELETE FROM dat_san
WHERE ma_dat_san LIKE 'DS_BIG_%';

-- 4. Tao them san de dat khoang 100 san
DO $$
DECLARE
    i INT;
    v_ma_san VARCHAR(20);
    v_ma_chu_san VARCHAR(20);
    v_ma_khu_vuc VARCHAR(20);
BEGIN
    FOR i IN 1..100 LOOP
        v_ma_san := 'S' || LPAD(i::TEXT, 2, '0');

        SELECT ma_chu_san
        INTO v_ma_chu_san
        FROM chu_san
        ORDER BY ma_chu_san
        OFFSET ((i - 1) % (SELECT COUNT(*) FROM chu_san))
        LIMIT 1;

        SELECT ma_khu_vuc
        INTO v_ma_khu_vuc
        FROM khu_vuc
        ORDER BY ma_khu_vuc
        OFFSET ((i - 1) % (SELECT COUNT(*) FROM khu_vuc))
        LIMIT 1;

        INSERT INTO san_bong (
            ma_san,
            ten_san,
            dia_chi,
            loai_san,
            gia_thue,
            trang_thai,
            ma_chu_san,
            ma_khu_vuc
        )
        VALUES (
            v_ma_san,
            'San bong test lon ' || i,
            'Dia chi test lon ' || i,
            CASE
                WHEN i % 3 = 0 THEN 'San 11 nguoi'
                WHEN i % 3 = 1 THEN 'San 5 nguoi'
                ELSE 'San 7 nguoi'
            END,
            CASE
                WHEN i % 3 = 0 THEN 500000
                WHEN i % 3 = 1 THEN 250000
                ELSE 350000
            END,
            'Hoat dong',
            v_ma_chu_san,
            v_ma_khu_vuc
        )
        ON CONFLICT (ma_san) DO NOTHING;
    END LOOP;

    UPDATE san_bong
    SET trang_thai = 'Hoat dong'
    WHERE ma_san IN (
        SELECT 'S' || LPAD(g::TEXT, 2, '0')
        FROM generate_series(1, 100) AS g
    );
END;
$$;

-- 5. Sinh 5.000 don dat san
-- 100 san * 7 khung gio = 700 don/ngay, 5.000 don can khoang 8 ngay.
-- Cach phan bo nay khong trung ma_san + ngay_dat + ma_khung_gio.
DO $$
DECLARE
    i INT;
    v_ma_dat_san VARCHAR(20);
    v_ma_khach_hang VARCHAR(20);
    v_ma_san VARCHAR(20);
    v_ma_khung_gio VARCHAR(20);
    v_ngay_dat DATE;
    v_ket_qua TEXT;
    v_slot INT;
BEGIN
    FOR i IN 1..5000 LOOP
        v_slot := i - 1;

        v_ma_dat_san := 'DS_BIG_' || LPAD(i::TEXT, 5, '0');
        v_ma_khach_hang := 'KH' || LPAD(((v_slot % 25) + 1)::TEXT, 2, '0');
        v_ma_san := 'S' || LPAD(((v_slot % 100) + 1)::TEXT, 2, '0');
        v_ma_khung_gio := 'KG' || LPAD((((v_slot / 100)::INT % 7) + 1)::TEXT, 2, '0');
        v_ngay_dat := DATE '2027-01-01' + ((v_slot / 700)::INT);

        SELECT fn_dat_san_bong(
            v_ma_dat_san,
            v_ma_khach_hang,
            v_ma_san,
            v_ma_khung_gio,
            v_ngay_dat
        )
        INTO v_ket_qua;
    END LOOP;
END;
$$;

-- 6. Cap nhat trang thai don va hoa don
-- 70% da xac nhan + da thanh toan, 20% cho xac nhan, 10% da huy.
UPDATE dat_san
SET trang_thai_dat = 'Da xac nhan'
WHERE ma_dat_san LIKE 'DS_BIG_%'
  AND CAST(SUBSTRING(ma_dat_san FROM 8) AS INT) % 10 IN (0, 1, 2, 3, 4, 5, 6);

UPDATE dat_san
SET trang_thai_dat = 'Da huy'
WHERE ma_dat_san LIKE 'DS_BIG_%'
  AND CAST(SUBSTRING(ma_dat_san FROM 8) AS INT) % 10 = 9;

UPDATE thanh_toan tt
SET trang_thai_thanh_toan = 'Da thanh toan'
FROM dat_san ds
WHERE tt.ma_dat_san = ds.ma_dat_san
  AND ds.ma_dat_san LIKE 'DS_BIG_%'
  AND ds.trang_thai_dat = 'Da xac nhan';

UPDATE thanh_toan tt
SET tong_tien_san = 0,
    tong_tien_dich_vu = 0,
    tong_tien = 0,
    trang_thai_thanh_toan = 'Chua thanh toan'
FROM dat_san ds
WHERE tt.ma_dat_san = ds.ma_dat_san
  AND ds.ma_dat_san LIKE 'DS_BIG_%'
  AND ds.trang_thai_dat = 'Da huy';

-- 7. Them dich vu cho khoang 1/3 so don
DO $$
DECLARE
    i INT;
    v_ma_dat_san VARCHAR(20);
    v_ma_dich_vu VARCHAR(20);
    v_so_luong INT;
    v_ket_qua TEXT;
BEGIN
    FOR i IN 1..5000 LOOP
        IF i % 3 = 0 THEN
            v_ma_dat_san := 'DS_BIG_' || LPAD(i::TEXT, 5, '0');
            v_ma_dich_vu := 'DV' || LPAD(((i % 10) + 1)::TEXT, 2, '0');
            v_so_luong := (i % 5) + 1;

            SELECT fn_them_dich_vu_cho_don(
                v_ma_dat_san,
                v_ma_dich_vu,
                v_so_luong
            )
            INTO v_ket_qua;
        END IF;
    END LOOP;
END;
$$;

-- Cap nhat lai trang thai thanh toan cho cac don da xac nhan sau khi them dich vu
UPDATE thanh_toan tt
SET trang_thai_thanh_toan = 'Da thanh toan'
FROM dat_san ds
WHERE tt.ma_dat_san = ds.ma_dat_san
  AND ds.ma_dat_san LIKE 'DS_BIG_%'
  AND ds.trang_thai_dat = 'Da xac nhan';

-- 8. Kiem tra so luong du lieu sau khi sinh
SELECT 'san_bong' AS bang, COUNT(*) AS so_luong FROM san_bong
UNION ALL
SELECT 'dat_san', COUNT(*) FROM dat_san
UNION ALL
SELECT 'dat_san_big', COUNT(*) FROM dat_san WHERE ma_dat_san LIKE 'DS_BIG_%'
UNION ALL
SELECT 'thanh_toan_big', COUNT(*) FROM thanh_toan WHERE ma_dat_san LIKE 'DS_BIG_%'
UNION ALL
SELECT 'chi_tiet_dich_vu_big', COUNT(*) FROM chi_tiet_dich_vu WHERE ma_dat_san LIKE 'DS_BIG_%';

-- 9. EXPLAIN ANALYZE do hieu nang

-- 9.1. Tim san trong theo ngay va khung gio
EXPLAIN ANALYZE
SELECT
    sb.ma_san,
    sb.ten_san,
    sb.loai_san,
    sb.gia_thue
FROM san_bong sb
WHERE sb.trang_thai = 'Hoat dong'
  AND sb.ma_san NOT IN (
      SELECT ds.ma_san
      FROM dat_san ds
      WHERE ds.ngay_dat = DATE '2027-01-03'
        AND ds.ma_khung_gio = 'KG03'
        AND ds.trang_thai_dat <> 'Da huy'
  )
ORDER BY sb.ma_san;

-- 9.2. Thong ke doanh thu theo san
EXPLAIN ANALYZE
SELECT *
FROM v_doanh_thu_theo_san
ORDER BY tong_doanh_thu DESC
LIMIT 10;

-- 9.3. Thong ke doanh thu theo thang
EXPLAIN ANALYZE
SELECT *
FROM v_doanh_thu_theo_thang
ORDER BY thang;

-- 9.4. Thong ke dich vu ban chay
EXPLAIN ANALYZE
SELECT *
FROM v_dich_vu_ban_chay
ORDER BY tong_so_luong_ban DESC
LIMIT 10;

-- 9.5. Tinh ty le huy san
EXPLAIN ANALYZE
SELECT *
FROM v_ty_le_huy_san;
