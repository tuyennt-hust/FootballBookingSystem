-- Kiem thu tich hop Phan 6. Toan bo du lieu test duoc ROLLBACK.
\set ON_ERROR_STOP on

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'san_bong'
          AND column_name = 'image_url'
    ) THEN
        RAISE EXCEPTION 'Migration image_url chua duoc ap dung';
    END IF;
END;
$$;

SELECT fn_them_san_bong(
    'S_OWNER_TEST',
    'San kiem thu chu san',
    'So 1 Dai Co Viet',
    'San 5 nguoi',
    250000,
    'CS01',
    'KV01'
) AS ket_qua_them_san;

UPDATE san_bong
SET image_url = '/uploads/pitches/test.webp'
WHERE ma_san = 'S_OWNER_TEST'
  AND ma_chu_san = 'CS01';

SELECT ma_san, ma_chu_san, trang_thai, image_url
FROM san_bong
WHERE ma_san = 'S_OWNER_TEST';

SELECT fn_dat_san_bong(
    'DS_OWNER_TEST',
    'KH01',
    'S_OWNER_TEST',
    'KG01',
    CURRENT_DATE + 5
) AS ket_qua_dat_san;

SELECT fn_xac_nhan_don_dat_san('DS_OWNER_TEST') AS ket_qua_xac_nhan;

SELECT
    ds.ma_dat_san,
    ds.trang_thai_dat,
    tt.ma_thanh_toan,
    tt.tong_tien_san,
    tt.trang_thai_thanh_toan
FROM dat_san ds
JOIN thanh_toan tt ON tt.ma_dat_san = ds.ma_dat_san
WHERE ds.ma_dat_san = 'DS_OWNER_TEST';

ROLLBACK;
