-- =====================================================
-- 04_triggers.sql
-- Trigger functions va triggers cho FootballBookingSystem
-- Chay sau:
--   01_schema.sql
--   02_seed.sql
--   03_functions.sql
-- =====================================================

-- =====================================================
-- XOA TRIGGER CU NEU CO
-- =====================================================

DROP TRIGGER IF EXISTS tg_kiem_tra_trung_lich ON dat_san;
DROP TRIGGER IF EXISTS tg_tinh_tien_san ON dat_san;
DROP TRIGGER IF EXISTS tg_tao_hoa_don ON dat_san;
DROP TRIGGER IF EXISTS tg_tinh_tien_chi_tiet_dich_vu ON chi_tiet_dich_vu;
DROP TRIGGER IF EXISTS tg_cap_nhat_tien_dich_vu ON chi_tiet_dich_vu;

-- =====================================================
-- XOA TRIGGER FUNCTION CU NEU CO
-- =====================================================

DROP FUNCTION IF EXISTS trg_kiem_tra_trung_lich();
DROP FUNCTION IF EXISTS trg_tinh_tien_san();
DROP FUNCTION IF EXISTS trg_tao_hoa_don();
DROP FUNCTION IF EXISTS trg_tinh_tien_chi_tiet_dich_vu();
DROP FUNCTION IF EXISTS trg_cap_nhat_tien_dich_vu();

-- =====================================================
-- TRIGGER DAT SAN VA THANH TOAN
-- =====================================================

-- Trigger 1. Kiem tra trung lich dat san
CREATE OR REPLACE FUNCTION trg_kiem_tra_trung_lich()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.trang_thai_dat <> 'Da huy'
       AND EXISTS (
            SELECT 1
            FROM dat_san ds
            WHERE ds.ma_san = NEW.ma_san
              AND ds.ma_khung_gio = NEW.ma_khung_gio
              AND ds.ngay_dat = NEW.ngay_dat
              AND ds.trang_thai_dat <> 'Da huy'
              AND ds.ma_dat_san <> NEW.ma_dat_san
       ) THEN
        RAISE EXCEPTION 'San da duoc dat trong ngay va khung gio nay';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_kiem_tra_trung_lich
BEFORE INSERT OR UPDATE ON dat_san
FOR EACH ROW
EXECUTE FUNCTION trg_kiem_tra_trung_lich();


-- Trigger 2. Tu tinh tien san, gio diem tang 20 phan tram
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

    IF v_gia_thue IS NULL THEN
        RAISE EXCEPTION 'San bong khong ton tai';
    END IF;

    IF v_la_gio_diem IS NULL THEN
        RAISE EXCEPTION 'Khung gio khong ton tai';
    END IF;

    IF v_la_gio_diem = TRUE THEN
        NEW.tien_san := v_gia_thue * 1.2;
    ELSE
        NEW.tien_san := v_gia_thue;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_tinh_tien_san
BEFORE INSERT ON dat_san
FOR EACH ROW
EXECUTE FUNCTION trg_tinh_tien_san();


-- Trigger 3. Tu tao hoa don sau khi them don dat san
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

CREATE TRIGGER tg_tao_hoa_don
AFTER INSERT ON dat_san
FOR EACH ROW
EXECUTE FUNCTION trg_tao_hoa_don();


-- Trigger 4. Tu tinh don gia va thanh tien cua chi tiet dich vu
CREATE OR REPLACE FUNCTION trg_tinh_tien_chi_tiet_dich_vu()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_don_gia NUMERIC(12,2);
BEGIN
    IF NEW.so_luong <= 0 THEN
        RAISE EXCEPTION 'So luong dich vu phai lon hon 0';
    END IF;

    SELECT don_gia
    INTO v_don_gia
    FROM dich_vu
    WHERE ma_dich_vu = NEW.ma_dich_vu;

    IF v_don_gia IS NULL THEN
        RAISE EXCEPTION 'Dich vu khong ton tai';
    END IF;

    NEW.don_gia := v_don_gia;
    NEW.thanh_tien := NEW.so_luong * v_don_gia;

    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_tinh_tien_chi_tiet_dich_vu
BEFORE INSERT OR UPDATE ON chi_tiet_dich_vu
FOR EACH ROW
EXECUTE FUNCTION trg_tinh_tien_chi_tiet_dich_vu();


-- Trigger 5. Cap nhat tong tien dich vu va tong tien hoa don
CREATE OR REPLACE FUNCTION trg_cap_nhat_tien_dich_vu()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_ma_dat_san VARCHAR;
    v_tong_dich_vu NUMERIC(12,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_ma_dat_san := OLD.ma_dat_san;
    ELSE
        v_ma_dat_san := NEW.ma_dat_san;
    END IF;

    SELECT COALESCE(SUM(thanh_tien), 0)
    INTO v_tong_dich_vu
    FROM chi_tiet_dich_vu
    WHERE ma_dat_san = v_ma_dat_san;

    UPDATE thanh_toan
    SET tong_tien_dich_vu = v_tong_dich_vu,
        tong_tien = tong_tien_san + v_tong_dich_vu
    WHERE ma_dat_san = v_ma_dat_san;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_cap_nhat_tien_dich_vu
AFTER INSERT OR UPDATE OR DELETE ON chi_tiet_dich_vu
FOR EACH ROW
EXECUTE FUNCTION trg_cap_nhat_tien_dich_vu();
