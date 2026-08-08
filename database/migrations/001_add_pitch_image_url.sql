-- Migration 001 - Them anh dai dien cho san bong
-- Ap dung mot lan tren database hien tai. Khong can chay lai schema/seed.

BEGIN;

ALTER TABLE san_bong
ADD COLUMN IF NOT EXISTS image_url VARCHAR(300);

COMMENT ON COLUMN san_bong.image_url IS
'Duong dan anh dai dien cong khai, vi du /uploads/pitches/ten-file.webp';

COMMIT;
