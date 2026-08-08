-- Part 7 integration smoke test. Run on a disposable/test database or rely on ROLLBACK.
BEGIN;

-- Use a confirmed, unpaid booking from the current database when available.
DO $$
DECLARE
    v_booking VARCHAR;
    v_service VARCHAR;
    v_result TEXT;
BEGIN
    SELECT ds.ma_dat_san
    INTO v_booking
    FROM dat_san ds
    JOIN thanh_toan tt ON tt.ma_dat_san = ds.ma_dat_san
    WHERE ds.trang_thai_dat = 'Da xac nhan'
      AND tt.trang_thai_thanh_toan = 'Chua thanh toan'
    ORDER BY ds.ma_dat_san
    LIMIT 1;

    SELECT ma_dich_vu INTO v_service FROM dich_vu ORDER BY ma_dich_vu LIMIT 1;

    IF v_booking IS NOT NULL AND v_service IS NOT NULL THEN
        SELECT fn_them_dich_vu_cho_don(v_booking, v_service, 1) INTO v_result;
        IF v_result <> 'Them dich vu vao don thanh cong' THEN
            RAISE EXCEPTION 'Them dich vu that bai: %', v_result;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM thanh_toan tt
            WHERE tt.ma_dat_san = v_booking
              AND tt.tong_tien_dich_vu > 0
              AND tt.tong_tien = tt.tong_tien_san + tt.tong_tien_dich_vu
        ) THEN
            RAISE EXCEPTION 'Trigger tong tien dich vu khong cap nhat dung';
        END IF;

        SELECT fn_thanh_toan_hoa_don(v_booking) INTO v_result;
        IF v_result <> 'Thanh toan hoa don thanh cong' THEN
            RAISE EXCEPTION 'Thanh toan that bai: %', v_result;
        END IF;
    END IF;
END $$;

ROLLBACK;
