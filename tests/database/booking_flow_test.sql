-- Kiem thu thu cong luong dat san (cau 16-23)
-- Chi chay sau khi khoi tao database. Khong dung nhu file migration.

-- 1 đặt sân bóng bằng fn_dặt_sân_bóng

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
    -- Kiem tra ma dat san da ton tai chua
    IF EXISTS (
        SELECT 1
        FROM dat_san
        WHERE ma_dat_san = p_ma_dat_san
    ) THEN
        RETURN 'Ma dat san da ton tai';
    END IF;

    -- Kiem tra khach hang co ton tai khong
    IF NOT EXISTS (
        SELECT 1
        FROM khach_hang
        WHERE ma_khach_hang = p_ma_khach_hang
    ) THEN
        RETURN 'Khach hang khong ton tai';
    END IF;

    -- Kiem tra san co ton tai va dang hoat dong khong
    IF NOT EXISTS (
        SELECT 1
        FROM san_bong
        WHERE ma_san = p_ma_san
          AND trang_thai = 'Hoat dong'
    ) THEN
        RETURN 'San khong ton tai hoac khong hoat dong';
    END IF;

    -- Kiem tra khung gio co ton tai khong
    IF NOT EXISTS (
        SELECT 1
        FROM khung_gio
        WHERE ma_khung_gio = p_ma_khung_gio
    ) THEN
        RETURN 'Khung gio khong ton tai';
    END IF;

    -- Kiem tra trung lich
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

    -- Them don dat san
    INSERT INTO dat_san (
        ma_dat_san,
        ma_khach_hang,
        ma_san,
        ma_khung_gio,
        ngay_dat,
        trang_thai_dat
    )
    VALUES (
        p_ma_dat_san,
        p_ma_khach_hang,
        p_ma_san,
        p_ma_khung_gio,
        p_ngay_dat,
        'Cho xac nhan'
    );

    RETURN 'Dat san thanh cong';
END;
$$;


SELECT fn_dat_san_bong(
    'DS999',
    'KH01',
    'S01',
    'KG03',
    '2026-06-15'
);


-- =====================================================
-- CAU 17. HUY DON DAT SAN
-- =====================================================

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

    UPDATE dat_san
    SET trang_thai_dat = 'Da huy'
    WHERE ma_dat_san = p_ma_dat_san;

    UPDATE thanh_toan
    SET trang_thai_thanh_toan = 'Chua thanh toan',
        tong_tien_san = 0,
        tong_tien_dich_vu = 0,
        tong_tien = 0
    WHERE ma_dat_san = p_ma_dat_san;

    RETURN 'Huy don dat san thanh cong';
END;
$$;

-- Goi thu cau 17
SELECT fn_huy_don_dat_san('DS011');
SELECT *
FROM dat_san
WHERE ma_dat_san = 'DS011';


-- =====================================================
-- CAU 18. XAC NHAN DON DAT SAN
-- =====================================================

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

-- Goi thu cau 18
SELECT fn_xac_nhan_don_dat_san('DS013');

SELECT *
FROM dat_san
WHERE ma_dat_san = 'DS012';


-- =====================================================
-- CAU 19. THEM DICH VU VAO DON DAT SAN
-- =====================================================

CREATE OR REPLACE FUNCTION fn_them_dich_vu_cho_don(
    p_ma_dat_san VARCHAR,
    p_ma_dich_vu VARCHAR,
    p_so_luong INT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_don_gia NUMERIC(12,2);
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

    SELECT don_gia
    INTO v_don_gia
    FROM dich_vu
    WHERE ma_dich_vu = p_ma_dich_vu;

    IF v_don_gia IS NULL THEN
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
        v_don_gia,
        p_so_luong * v_don_gia
    )
    ON CONFLICT (ma_dat_san, ma_dich_vu)
    DO UPDATE
    SET so_luong = chi_tiet_dich_vu.so_luong + EXCLUDED.so_luong,
        don_gia = EXCLUDED.don_gia,
        thanh_tien = (chi_tiet_dich_vu.so_luong + EXCLUDED.so_luong) * EXCLUDED.don_gia;

    RETURN 'Them dich vu vao don thanh cong';
END;
$$;

-- Goi thu cau 19
SELECT fn_them_dich_vu_cho_don('DS012', 'DV01', 3);



-- =====================================================
-- TRIGGER PHUC VU CAU 19
-- TU CAP NHAT TIEN DICH VU VA TONG TIEN HOA DON
-- =====================================================

CREATE OR REPLACE FUNCTION trg_cap_nhat_tien_dich_vu()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_tong_dich_vu NUMERIC(12,2);
BEGIN
    SELECT SUM(thanh_tien)
    INTO v_tong_dich_vu
    FROM chi_tiet_dich_vu
    WHERE ma_dat_san = NEW.ma_dat_san;

    UPDATE thanh_toan
    SET tong_tien_dich_vu = v_tong_dich_vu,
        tong_tien = tong_tien_san + v_tong_dich_vu
    WHERE ma_dat_san = NEW.ma_dat_san;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_cap_nhat_tien_dich_vu ON chi_tiet_dich_vu;

CREATE TRIGGER tg_cap_nhat_tien_dich_vu
AFTER INSERT OR UPDATE ON chi_tiet_dich_vu
FOR EACH ROW
EXECUTE FUNCTION trg_cap_nhat_tien_dich_vu();

-- =====================================================
-- CAU 20. XEM CHI TIET DICH VU CUA MOT DON DAT SAN
-- =====================================================

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
WHERE ct.ma_dat_san = 'DS013';


-- =====================================================
-- CAU 21. KIEM TRA TRIGGER TU TAO HOA DON THANH TOAN
-- =====================================================

-- Trigger tinh tien san truoc khi them don dat san

CREATE OR REPLACE FUNCTION trg_tinh_tien_san()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_gia_thue NUMERIC(12,2);
    v_la_gio_diem BOOLEAN;
BEGIN
    SELECT gia_thue
    INTO v_gia_thue
    FROM san_bong
    WHERE ma_san = NEW.ma_san;

    SELECT la_gio_diem
    INTO v_la_gio_diem
    FROM khung_gio
    WHERE ma_khung_gio = NEW.ma_khung_gio;

    IF v_la_gio_diem = TRUE THEN
        NEW.tien_san := v_gia_thue * 1.2;
    ELSE
        NEW.tien_san := v_gia_thue;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_tinh_tien_san ON dat_san;

CREATE TRIGGER tg_tinh_tien_san
BEFORE INSERT ON dat_san
FOR EACH ROW
EXECUTE FUNCTION trg_tinh_tien_san();


-- Trigger tu tao hoa don sau khi them don dat san

CREATE OR REPLACE FUNCTION trg_tao_hoa_don()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO thanh_toan (
        ma_thanh_toan,
        tong_tien_san,
        tong_tien_dich_vu,
        tong_tien,
        trang_thai_thanh_toan,
        ma_dat_san
    )
    VALUES (
        'TT_' || NEW.ma_dat_san,
        NEW.tien_san,
        0,
        NEW.tien_san,
        'Chua thanh toan',
        NEW.ma_dat_san
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_tao_hoa_don ON dat_san;

CREATE TRIGGER tg_tao_hoa_don
AFTER INSERT ON dat_san
FOR EACH ROW
EXECUTE FUNCTION trg_tao_hoa_don();


-- Xoa du lieu test neu da ton tai de chay lai khong bi trung

DELETE FROM chi_tiet_dich_vu
WHERE ma_dat_san = 'DS_TEST21';

DELETE FROM thanh_toan
WHERE ma_dat_san = 'DS_TEST21';

DELETE FROM dat_san
WHERE ma_dat_san = 'DS_TEST21';


-- Them don dat san moi de kiem tra trigger

INSERT INTO dat_san (
    ma_dat_san,
    ngay_dat,
    trang_thai_dat,
    ma_san,
    ma_khach_hang,
    ma_khung_gio
)
VALUES (
    'DS_TEST21',
    '2026-08-30',
    'Cho xac nhan',
    'S01',
    'KH01',
    'KG03'
);


-- Kiem tra hoa don co duoc tao tu dong khong

SELECT *
FROM thanh_toan
WHERE ma_dat_san = 'DS_TEST21';


-- =====================================================
-- CAU 21. KIEM TRA TRIGGER TU TAO HOA DON THANH TOAN
-- =====================================================

-- Trigger tinh tien san truoc khi them don dat san

CREATE OR REPLACE FUNCTION trg_tinh_tien_san()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_gia_thue NUMERIC(12,2);
    v_la_gio_diem BOOLEAN;
BEGIN
    SELECT gia_thue
    INTO v_gia_thue
    FROM san_bong
    WHERE ma_san = NEW.ma_san;

    SELECT la_gio_diem
    INTO v_la_gio_diem
    FROM khung_gio
    WHERE ma_khung_gio = NEW.ma_khung_gio;

    IF v_la_gio_diem = TRUE THEN
        NEW.tien_san := v_gia_thue * 1.2;
    ELSE
        NEW.tien_san := v_gia_thue;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_tinh_tien_san ON dat_san;

CREATE TRIGGER tg_tinh_tien_san
BEFORE INSERT ON dat_san
FOR EACH ROW
EXECUTE FUNCTION trg_tinh_tien_san();


-- Trigger tu tao hoa don sau khi them don dat san

CREATE OR REPLACE FUNCTION trg_tao_hoa_don()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO thanh_toan (
        ma_thanh_toan,
        tong_tien_san,
        tong_tien_dich_vu,
        tong_tien,
        trang_thai_thanh_toan,
        ma_dat_san
    )
    VALUES (
        'TT_' || NEW.ma_dat_san,
        NEW.tien_san,
        0,
        NEW.tien_san,
        'Chua thanh toan',
        NEW.ma_dat_san
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_tao_hoa_don ON dat_san;

CREATE TRIGGER tg_tao_hoa_don
AFTER INSERT ON dat_san
FOR EACH ROW
EXECUTE FUNCTION trg_tao_hoa_don();


-- Xoa du lieu test neu da ton tai de chay lai khong bi trung

DELETE FROM chi_tiet_dich_vu
WHERE ma_dat_san = 'DS_TEST21';

DELETE FROM thanh_toan
WHERE ma_dat_san = 'DS_TEST21';

DELETE FROM dat_san
WHERE ma_dat_san = 'DS_TEST21';


-- Them don dat san moi de kiem tra trigger

INSERT INTO dat_san (
    ma_dat_san,
    ngay_dat,
    trang_thai_dat,
    ma_san,
    ma_khach_hang,
    ma_khung_gio
)
VALUES (
    'DS_TEST21',
    '2026-08-30',
    'Cho xac nhan',
    'S01',
    'KH01',
    'KG03'
);


-- Kiem tra hoa don co duoc tao tu dong khong
SELECT fn_thanh_toan_hoa_don('DS_TEST21');
SELECT *
FROM thanh_toan
WHERE ma_dat_san = 'DS_TEST21';

-- =====================================================
-- CAU 23. XEM CHI TIET HOA DON CUA MOT DON DAT SAN
-- =====================================================

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
WHERE ds.ma_dat_san = 'DS_TEST21';
