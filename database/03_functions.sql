-- =====================================================
-- 03_functions.sql
-- Business functions cho FootballBookingSystem
-- Chay sau:
--   01_schema.sql
--   02_seed.sql
-- =====================================================

-- Ho tro kiem tra mat khau bcrypt trong fn_dang_nhap
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- XOA BUSINESS FUNCTION CU NEU CO
-- =====================================================

DROP FUNCTION IF EXISTS fn_dang_ky_khach_hang(VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_dang_nhap(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_cap_nhat_sdt_khach_hang(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_doi_mat_khau_tai_khoan(VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_lich_su_dat_san(VARCHAR);
DROP FUNCTION IF EXISTS fn_top_10_khach_hang_chi_tieu();
DROP FUNCTION IF EXISTS fn_phan_loai_khach_hang();

DROP FUNCTION IF EXISTS fn_them_san_bong(VARCHAR, VARCHAR, VARCHAR, VARCHAR, NUMERIC, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_xoa_san_bong(VARCHAR);

DROP FUNCTION IF EXISTS fn_dat_san_bong(VARCHAR, VARCHAR, VARCHAR, VARCHAR, DATE);
DROP FUNCTION IF EXISTS fn_huy_don_dat_san(VARCHAR);
DROP FUNCTION IF EXISTS fn_xac_nhan_don_dat_san(VARCHAR);
DROP FUNCTION IF EXISTS fn_them_dich_vu_cho_don(VARCHAR, VARCHAR, INT);
DROP FUNCTION IF EXISTS fn_thanh_toan_hoa_don(VARCHAR);

-- =====================================================
-- NHOM 1: TAI KHOAN VA KHACH HANG
-- =====================================================

-- 1. Dang ky tai khoan khach hang moi
CREATE OR REPLACE FUNCTION fn_dang_ky_khach_hang(
    p_ten_dang_nhap VARCHAR,
    p_mat_khau VARCHAR,
    p_ho_va_ten VARCHAR,
    p_sdt VARCHAR
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_stt INT;
    v_ma_tai_khoan VARCHAR(20);
    v_ma_khach_hang VARCHAR(20);
BEGIN
    IF EXISTS (
        SELECT 1
        FROM tai_khoan
        WHERE ten_dang_nhap = p_ten_dang_nhap
    ) THEN
        RETURN 'Ten dang nhap da ton tai';
    END IF;

    SELECT COALESCE(MAX(CAST(SUBSTRING(ma_khach_hang FROM 3) AS INT)), 0) + 1
    INTO v_stt
    FROM khach_hang
    WHERE ma_khach_hang ~ '^KH[0-9]+$';

    v_ma_khach_hang := 'KH' || LPAD(v_stt::TEXT, 2, '0');
    v_ma_tai_khoan := 'TK_KH' || LPAD(v_stt::TEXT, 2, '0');

    IF p_mat_khau NOT LIKE '$2a$%' AND OCTET_LENGTH(p_mat_khau) > 72 THEN
        RETURN 'Mat khau qua dai';
    END IF;

    INSERT INTO tai_khoan (
        ma_tai_khoan,
        ten_dang_nhap,
        mat_khau,
        vai_tro,
        trang_thai
    )
    VALUES (
        v_ma_tai_khoan,
        p_ten_dang_nhap,
        CASE
            WHEN p_mat_khau LIKE '$2a$%' THEN p_mat_khau
            ELSE crypt(p_mat_khau, gen_salt('bf', 12))
        END,
        'Khach hang',
        'Hoat dong'
    );

    INSERT INTO khach_hang (
        ma_khach_hang,
        ho_va_ten,
        sdt,
        ma_tai_khoan
    )
    VALUES (
        v_ma_khach_hang,
        p_ho_va_ten,
        p_sdt,
        v_ma_tai_khoan
    );

    RETURN 'Dang ky khach hang thanh cong: ' || v_ma_khach_hang;
END;
$$;


-- 2. Dang nhap
CREATE OR REPLACE FUNCTION fn_dang_nhap(
    p_ten_dang_nhap VARCHAR,
    p_mat_khau VARCHAR
)
RETURNS TABLE (
    ma_tai_khoan VARCHAR,
    vai_tro VARCHAR,
    ket_qua TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM tai_khoan tk
        WHERE tk.ten_dang_nhap = p_ten_dang_nhap
    ) THEN
        RETURN QUERY
        SELECT NULL::VARCHAR, NULL::VARCHAR, 'Tai khoan khong ton tai'::TEXT;
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tai_khoan tk
        WHERE tk.ten_dang_nhap = p_ten_dang_nhap
          AND tk.trang_thai = 'Bi khoa'
    ) THEN
        RETURN QUERY
        SELECT NULL::VARCHAR, NULL::VARCHAR, 'Tai khoan bi khoa'::TEXT;
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM tai_khoan tk
        WHERE tk.ten_dang_nhap = p_ten_dang_nhap
          AND (
              tk.mat_khau = p_mat_khau
              OR (
                  tk.mat_khau LIKE '$2a$%'
                  AND tk.mat_khau = crypt(p_mat_khau, tk.mat_khau)
              )
          )
    ) THEN
        RETURN QUERY
        SELECT NULL::VARCHAR, NULL::VARCHAR, 'Sai mat khau'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        tk.ma_tai_khoan,
        tk.vai_tro,
        'Dang nhap thanh cong'::TEXT
    FROM tai_khoan tk
    WHERE tk.ten_dang_nhap = p_ten_dang_nhap
      AND (
          tk.mat_khau = p_mat_khau
          OR (
              tk.mat_khau LIKE '$2a$%'
              AND tk.mat_khau = crypt(p_mat_khau, tk.mat_khau)
          )
      )
      AND tk.trang_thai = 'Hoat dong';
END;
$$;


-- 3. Cap nhat so dien thoai khach hang
CREATE OR REPLACE FUNCTION fn_cap_nhat_sdt_khach_hang(
    p_ma_khach_hang VARCHAR,
    p_sdt_moi VARCHAR
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM khach_hang
        WHERE ma_khach_hang = p_ma_khach_hang
    ) THEN
        RETURN 'Khach hang khong ton tai';
    END IF;

    UPDATE khach_hang
    SET sdt = p_sdt_moi
    WHERE ma_khach_hang = p_ma_khach_hang;

    RETURN 'Cap nhat so dien thoai thanh cong';
END;
$$;


-- 4. Doi mat khau tai khoan
CREATE OR REPLACE FUNCTION fn_doi_mat_khau_tai_khoan(
    p_ten_dang_nhap VARCHAR,
    p_mat_khau_cu VARCHAR,
    p_mat_khau_moi VARCHAR
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM tai_khoan
        WHERE ten_dang_nhap = p_ten_dang_nhap
    ) THEN
        RETURN 'Tai khoan khong ton tai';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM tai_khoan
        WHERE ten_dang_nhap = p_ten_dang_nhap
          AND (
              mat_khau = p_mat_khau_cu
              OR (
                  mat_khau LIKE '$2a$%'
                  AND mat_khau = crypt(p_mat_khau_cu, mat_khau)
              )
          )
    ) THEN
        RETURN 'Mat khau cu khong dung';
    END IF;

    IF OCTET_LENGTH(p_mat_khau_moi) > 72 THEN
        RETURN 'Mat khau moi qua dai';
    END IF;

    UPDATE tai_khoan
    SET mat_khau = crypt(p_mat_khau_moi, gen_salt('bf', 12))
    WHERE ten_dang_nhap = p_ten_dang_nhap;

    RETURN 'Doi mat khau thanh cong';
END;
$$;


-- 5. Lich su dat san cua mot khach hang
CREATE OR REPLACE FUNCTION fn_lich_su_dat_san(
    p_ma_khach_hang VARCHAR
)
RETURNS TABLE (
    ma_dat_san VARCHAR,
    ngay_dat DATE,
    ten_san VARCHAR,
    gio_bat_dau TIME,
    gio_ket_thuc TIME,
    tien_san NUMERIC,
    trang_thai_dat VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ds.ma_dat_san,
        ds.ngay_dat,
        sb.ten_san,
        kg.gio_bat_dau,
        kg.gio_ket_thuc,
        ds.tien_san,
        ds.trang_thai_dat
    FROM dat_san ds
    JOIN san_bong sb
        ON ds.ma_san = sb.ma_san
    JOIN khung_gio kg
        ON ds.ma_khung_gio = kg.ma_khung_gio
    WHERE ds.ma_khach_hang = p_ma_khach_hang
    ORDER BY ds.ngay_dat DESC, kg.gio_bat_dau DESC;
END;
$$;


-- 6. Top 10 khach hang chi tieu nhieu nhat
CREATE OR REPLACE FUNCTION fn_top_10_khach_hang_chi_tieu()
RETURNS TABLE (
    xep_hang BIGINT,
    ma_khach_hang VARCHAR,
    ho_va_ten VARCHAR,
    sdt VARCHAR,
    tong_chi_tieu NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(tt.tong_tien) DESC) AS xep_hang,
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
      AND ds.trang_thai_dat <> 'Da huy'
    GROUP BY kh.ma_khach_hang, kh.ho_va_ten, kh.sdt
    ORDER BY tong_chi_tieu DESC
    LIMIT 10;
END;
$$;


-- 7. Phan loai khach hang theo tong chi tieu
CREATE OR REPLACE FUNCTION fn_phan_loai_khach_hang()
RETURNS TABLE (
    ma_khach_hang VARCHAR,
    ho_va_ten VARCHAR,
    sdt VARCHAR,
    tong_chi_tieu NUMERIC,
    phan_loai TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kh.ma_khach_hang,
        kh.ho_va_ten,
        kh.sdt,
        COALESCE(SUM(tt.tong_tien), 0) AS tong_chi_tieu,
        CASE
            WHEN COALESCE(SUM(tt.tong_tien), 0) >= 2000000 THEN 'VIP'
            WHEN COALESCE(SUM(tt.tong_tien), 0) >= 500000 THEN 'Than thiet'
            ELSE 'Tiem nang'
        END AS phan_loai
    FROM khach_hang kh
    LEFT JOIN dat_san ds
        ON kh.ma_khach_hang = ds.ma_khach_hang
       AND ds.trang_thai_dat <> 'Da huy'
    LEFT JOIN thanh_toan tt
        ON ds.ma_dat_san = tt.ma_dat_san
       AND tt.trang_thai_thanh_toan = 'Da thanh toan'
    GROUP BY kh.ma_khach_hang, kh.ho_va_ten, kh.sdt
    ORDER BY tong_chi_tieu DESC;
END;
$$;

-- =====================================================
-- NHOM 2: SAN BONG VA DICH VU
-- =====================================================

-- 8. Them san bong moi
CREATE OR REPLACE FUNCTION fn_them_san_bong(
    p_ma_san VARCHAR,
    p_ten_san VARCHAR,
    p_dia_chi VARCHAR,
    p_loai_san VARCHAR,
    p_gia_thue NUMERIC,
    p_ma_chu_san VARCHAR,
    p_ma_khu_vuc VARCHAR
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM san_bong
        WHERE ma_san = p_ma_san
    ) THEN
        RETURN 'Ma san da ton tai';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM chu_san
        WHERE ma_chu_san = p_ma_chu_san
    ) THEN
        RETURN 'Chu san khong ton tai';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM khu_vuc
        WHERE ma_khu_vuc = p_ma_khu_vuc
    ) THEN
        RETURN 'Khu vuc khong ton tai';
    END IF;

    IF p_loai_san NOT IN ('San 5 nguoi', 'San 7 nguoi', 'San 11 nguoi') THEN
        RETURN 'Loai san khong hop le';
    END IF;

    IF p_gia_thue < 0 THEN
        RETURN 'Gia thue khong hop le';
    END IF;

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
        p_ma_san,
        p_ten_san,
        p_dia_chi,
        p_loai_san,
        p_gia_thue,
        'Hoat dong',
        p_ma_chu_san,
        p_ma_khu_vuc
    );

    RETURN 'Them san bong thanh cong';
END;
$$;


-- 9. Ngung hoat dong san bong
CREATE OR REPLACE FUNCTION fn_xoa_san_bong(
    p_ma_san VARCHAR
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM san_bong
        WHERE ma_san = p_ma_san
    ) THEN
        RETURN 'San bong khong ton tai';
    END IF;

    UPDATE san_bong
    SET trang_thai = 'Ngung hoat dong'
    WHERE ma_san = p_ma_san;

    RETURN 'Ngung hoat dong san thanh cong';
END;
$$;

-- =====================================================
-- NHOM 3: DAT SAN VA THANH TOAN
-- =====================================================

-- 16. Dat san bong
CREATE OR REPLACE FUNCTION fn_dat_san_bong(
    p_ma_dat_san VARCHAR,
    p_ma_khach_hang VARCHAR,
    p_ma_san VARCHAR,
    p_ma_khung_gio VARCHAR,
    p_ngay_dat DATE
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM dat_san
        WHERE ma_dat_san = p_ma_dat_san
    ) THEN
        RETURN 'Ma dat san da ton tai';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM khach_hang
        WHERE ma_khach_hang = p_ma_khach_hang
    ) THEN
        RETURN 'Khach hang khong ton tai';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM san_bong
        WHERE ma_san = p_ma_san
          AND trang_thai = 'Hoat dong'
    ) THEN
        RETURN 'San khong ton tai hoac khong hoat dong';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM khung_gio
        WHERE ma_khung_gio = p_ma_khung_gio
    ) THEN
        RETURN 'Khung gio khong ton tai';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM dat_san
        WHERE ma_san = p_ma_san
          AND ma_khung_gio = p_ma_khung_gio
          AND ngay_dat = p_ngay_dat
          AND trang_thai_dat <> 'Da huy'
    ) THEN
        RETURN 'San da duoc dat trong khung gio nay';
    END IF;

    INSERT INTO dat_san (
        ma_dat_san,
        ngay_dat,
        trang_thai_dat,
        ma_san,
        ma_khach_hang,
        ma_khung_gio
    )
    VALUES (
        p_ma_dat_san,
        p_ngay_dat,
        'Cho xac nhan',
        p_ma_san,
        p_ma_khach_hang,
        p_ma_khung_gio
    );

    RETURN 'Dat san thanh cong';
END;
$$;


-- 17. Huy don dat san
CREATE OR REPLACE FUNCTION fn_huy_don_dat_san(
    p_ma_dat_san VARCHAR
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM dat_san
        WHERE ma_dat_san = p_ma_dat_san
    ) THEN
        RETURN 'Don dat san khong ton tai';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM thanh_toan
        WHERE ma_dat_san = p_ma_dat_san
          AND trang_thai_thanh_toan = 'Da thanh toan'
    ) THEN
        RETURN 'Don da thanh toan, khong the huy';
    END IF;

    UPDATE dat_san
    SET trang_thai_dat = 'Da huy'
    WHERE ma_dat_san = p_ma_dat_san;

    UPDATE thanh_toan
    SET tong_tien_san = 0,
        tong_tien_dich_vu = 0,
        tong_tien = 0,
        trang_thai_thanh_toan = 'Chua thanh toan'
    WHERE ma_dat_san = p_ma_dat_san;

    RETURN 'Huy don dat san thanh cong';
END;
$$;


-- 18. Xac nhan don dat san
CREATE OR REPLACE FUNCTION fn_xac_nhan_don_dat_san(
    p_ma_dat_san VARCHAR
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM dat_san
        WHERE ma_dat_san = p_ma_dat_san
    ) THEN
        RETURN 'Don dat san khong ton tai';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM dat_san
        WHERE ma_dat_san = p_ma_dat_san
          AND trang_thai_dat = 'Da huy'
    ) THEN
        RETURN 'Khong the xac nhan don da huy';
    END IF;

    UPDATE dat_san
    SET trang_thai_dat = 'Da xac nhan'
    WHERE ma_dat_san = p_ma_dat_san;

    RETURN 'Xac nhan don dat san thanh cong';
END;
$$;


-- 19. Them dich vu vao don dat san
CREATE OR REPLACE FUNCTION fn_them_dich_vu_cho_don(
    p_ma_dat_san VARCHAR,
    p_ma_dich_vu VARCHAR,
    p_so_luong INT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_so_luong <= 0 THEN
        RETURN 'So luong dich vu phai lon hon 0';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM dat_san
        WHERE ma_dat_san = p_ma_dat_san
          AND trang_thai_dat <> 'Da huy'
    ) THEN
        RETURN 'Don dat san khong ton tai hoac da bi huy';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM dich_vu
        WHERE ma_dich_vu = p_ma_dich_vu
    ) THEN
        RETURN 'Dich vu khong ton tai';
    END IF;

    INSERT INTO chi_tiet_dich_vu (
        ma_dat_san,
        ma_dich_vu,
        so_luong,
        don_gia,
        thanh_tien
    )
    VALUES (
        p_ma_dat_san,
        p_ma_dich_vu,
        p_so_luong,
        0,
        0
    )
    ON CONFLICT (ma_dat_san, ma_dich_vu)
    DO UPDATE
    SET so_luong = chi_tiet_dich_vu.so_luong + EXCLUDED.so_luong;

    RETURN 'Them dich vu vao don thanh cong';
END;
$$;


-- 22. Thanh toan hoa don
CREATE OR REPLACE FUNCTION fn_thanh_toan_hoa_don(
    p_ma_dat_san VARCHAR
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM thanh_toan
        WHERE ma_dat_san = p_ma_dat_san
    ) THEN
        RETURN 'Hoa don khong ton tai';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM dat_san
        WHERE ma_dat_san = p_ma_dat_san
          AND trang_thai_dat = 'Da huy'
    ) THEN
        RETURN 'Khong the thanh toan don da huy';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM thanh_toan
        WHERE ma_dat_san = p_ma_dat_san
          AND trang_thai_thanh_toan = 'Da thanh toan'
    ) THEN
        RETURN 'Hoa don da duoc thanh toan truoc do';
    END IF;

    UPDATE thanh_toan
    SET trang_thai_thanh_toan = 'Da thanh toan'
    WHERE ma_dat_san = p_ma_dat_san;

    RETURN 'Thanh toan hoa don thanh cong';
END;
$$;
