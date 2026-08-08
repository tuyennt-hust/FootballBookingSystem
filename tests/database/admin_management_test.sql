-- Part 08 manual integration checks. Run in a disposable/test database.
BEGIN;
SELECT COUNT(*) AS total_accounts FROM tai_khoan;
SELECT COUNT(*) AS total_pitches FROM san_bong;
SELECT * FROM fn_top_10_khach_hang_chi_tieu();
SELECT * FROM v_ty_le_huy_san;
SELECT * FROM v_doanh_thu_theo_thang ORDER BY thang DESC LIMIT 3;
ROLLBACK;
