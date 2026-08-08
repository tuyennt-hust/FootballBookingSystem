-- =====================================================
-- final_smoke_test.sql
-- Kiểm tra bất biến cuối dự án. Chỉ đọc dữ liệu, không sửa database.
-- Chạy: psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f tests/database/final_smoke_test.sql
-- =====================================================

\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- 10 bảng nghiệp vụ bắt buộc
    SELECT COUNT(*) INTO v_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'tai_khoan','khach_hang','chu_san','khu_vuc','khung_gio',
        'dich_vu','san_bong','dat_san','thanh_toan','chi_tiet_dich_vu'
      );
    IF v_count <> 10 THEN
        RAISE EXCEPTION 'Thieu bang nghiep vu: chi tim thay %/10', v_count;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM (
        SELECT ma_san, ngay_dat, ma_khung_gio
        FROM dat_san
        WHERE trang_thai_dat <> 'Da huy'
        GROUP BY ma_san, ngay_dat, ma_khung_gio
        HAVING COUNT(*) > 1
    ) x;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'Co % slot dang hoat dong bi dat trung', v_count;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM dat_san ds
    LEFT JOIN thanh_toan tt ON tt.ma_dat_san = ds.ma_dat_san
    WHERE tt.ma_dat_san IS NULL;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'Co % don khong co hoa don', v_count;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM thanh_toan
    WHERE ABS(tong_tien - (tong_tien_san + tong_tien_dich_vu)) > 0.01;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'Co % hoa don sai tong tien', v_count;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM chi_tiet_dich_vu
    WHERE ABS(thanh_tien - (so_luong * don_gia)) > 0.01;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'Co % chi tiet dich vu sai thanh tien', v_count;
    END IF;
END;
$$;

SELECT 'FINAL_DB_SMOKE_OK' AS ket_qua;
ROLLBACK;
