-- Kiem thu tam thoi logic khung gio da dat cua Phan 4.
-- Script chay trong transaction va ROLLBACK, khong giu lai du lieu.

BEGIN;

DELETE FROM thanh_toan WHERE ma_dat_san = 'DS_TEST_AVAIL';
DELETE FROM dat_san WHERE ma_dat_san = 'DS_TEST_AVAIL';

DO $$
DECLARE
    v_ma_san VARCHAR(20);
    v_ma_khung_gio VARCHAR(20);
BEGIN
    SELECT sb.ma_san, kg.ma_khung_gio
    INTO v_ma_san, v_ma_khung_gio
    FROM san_bong sb
    CROSS JOIN khung_gio kg
    WHERE sb.trang_thai = 'Hoat dong'
      AND NOT EXISTS (
          SELECT 1
          FROM dat_san ds
          WHERE ds.ma_san = sb.ma_san
            AND ds.ma_khung_gio = kg.ma_khung_gio
            AND ds.ngay_dat = CURRENT_DATE + 1
            AND ds.trang_thai_dat <> 'Da huy'
      )
    ORDER BY sb.ma_san, kg.gio_bat_dau
    LIMIT 1;

    IF v_ma_san IS NULL OR v_ma_khung_gio IS NULL THEN
        RAISE EXCEPTION 'Khong tim thay khung gio trong de kiem thu';
    END IF;

    INSERT INTO dat_san (
        ma_dat_san,
        ngay_dat,
        trang_thai_dat,
        tien_san,
        ma_san,
        ma_khach_hang,
        ma_khung_gio
    )
    VALUES (
        'DS_TEST_AVAIL',
        CURRENT_DATE + 1,
        'Cho xac nhan',
        0,
        v_ma_san,
        'KH01',
        v_ma_khung_gio
    );

    RAISE NOTICE 'Da tao don tam cho san %, khung gio %, ngay %',
        v_ma_san, v_ma_khung_gio, CURRENT_DATE + 1;
END;
$$;

SELECT
    ds.ma_dat_san,
    ds.ngay_dat,
    ds.ma_san,
    ds.ma_khung_gio,
    ds.trang_thai_dat,
    ds.tien_san
FROM dat_san ds
WHERE ds.ma_dat_san = 'DS_TEST_AVAIL';

SELECT
    tt.ma_thanh_toan,
    tt.tong_tien,
    tt.trang_thai_thanh_toan
FROM thanh_toan tt
WHERE tt.ma_dat_san = 'DS_TEST_AVAIL';

ROLLBACK;
