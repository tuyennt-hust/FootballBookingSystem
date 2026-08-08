-- 01_schema.sql

-- Xoa bang neu da ton tai
DROP TABLE IF EXISTS chi_tiet_dich_vu CASCADE;
DROP TABLE IF EXISTS thanh_toan CASCADE;
DROP TABLE IF EXISTS dat_san CASCADE;
DROP TABLE IF EXISTS san_bong CASCADE;
DROP TABLE IF EXISTS dich_vu CASCADE;
DROP TABLE IF EXISTS khung_gio CASCADE;
DROP TABLE IF EXISTS khu_vuc CASCADE;
DROP TABLE IF EXISTS khach_hang CASCADE;
DROP TABLE IF EXISTS chu_san CASCADE;
DROP TABLE IF EXISTS tai_khoan CASCADE;

-- 1. BANG TAI_KHOAN
CREATE TABLE tai_khoan (
    ma_tai_khoan VARCHAR(20) PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau VARCHAR(100) NOT NULL,
    vai_tro VARCHAR(20) NOT NULL,
    trang_thai VARCHAR(20) DEFAULT 'Hoat dong',

    CONSTRAINT chk_tai_khoan_vai_tro
        CHECK (vai_tro IN ('Khach hang', 'Chu san', 'Admin')),

    CONSTRAINT chk_tai_khoan_trang_thai
        CHECK (trang_thai IN ('Hoat dong', 'Bi khoa'))
);

-- 2. BANG KHACH_HANG
CREATE TABLE khach_hang (
    ma_khach_hang VARCHAR(20) PRIMARY KEY,
    ho_va_ten VARCHAR(100) NOT NULL,
    sdt VARCHAR(15),
    ma_tai_khoan VARCHAR(20) NOT NULL UNIQUE,

    CONSTRAINT fk_khach_hang_tai_khoan
        FOREIGN KEY (ma_tai_khoan)
        REFERENCES tai_khoan(ma_tai_khoan)
);

-- 3. BANG CHU_SAN
CREATE TABLE chu_san (
    ma_chu_san VARCHAR(20) PRIMARY KEY,
    ho_va_ten VARCHAR(100) NOT NULL,
    sdt VARCHAR(15),
    ma_tai_khoan VARCHAR(20) NOT NULL UNIQUE,

    CONSTRAINT fk_chu_san_tai_khoan
        FOREIGN KEY (ma_tai_khoan)
        REFERENCES tai_khoan(ma_tai_khoan)
);

-- 4. BANG KHU_VUC
CREATE TABLE khu_vuc (
    ma_khu_vuc VARCHAR(20) PRIMARY KEY,
    ten_khu_vuc VARCHAR(100) NOT NULL,
    quan_huyen VARCHAR(100) NOT NULL
);

-- 5. BANG KHUNG_GIO
CREATE TABLE khung_gio (
    ma_khung_gio VARCHAR(20) PRIMARY KEY,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    la_gio_diem BOOLEAN DEFAULT FALSE,

    CONSTRAINT chk_khung_gio_hop_le
        CHECK (gio_bat_dau < gio_ket_thuc)
);

-- 6. BANG DICH_VU
CREATE TABLE dich_vu (
    ma_dich_vu VARCHAR(20) PRIMARY KEY,
    ten_dv VARCHAR(100) NOT NULL,
    don_gia NUMERIC(12, 2) NOT NULL,

    CONSTRAINT chk_dich_vu_don_gia
        CHECK (don_gia >= 0)
);

-- 7. BANG SAN_BONG
CREATE TABLE san_bong (
    ma_san VARCHAR(20) PRIMARY KEY,
    ten_san VARCHAR(100) NOT NULL,
    dia_chi VARCHAR(200),
    loai_san VARCHAR(20) NOT NULL,
    gia_thue NUMERIC(12, 2) NOT NULL,
    trang_thai VARCHAR(30) DEFAULT 'Hoat dong',
    ma_chu_san VARCHAR(20) NOT NULL,
    ma_khu_vuc VARCHAR(20) NOT NULL,
    image_url VARCHAR(300),

    CONSTRAINT fk_san_bong_chu_san
        FOREIGN KEY (ma_chu_san)
        REFERENCES chu_san(ma_chu_san),

    CONSTRAINT fk_san_bong_khu_vuc
        FOREIGN KEY (ma_khu_vuc)
        REFERENCES khu_vuc(ma_khu_vuc),

    CONSTRAINT chk_san_bong_loai_san
        CHECK (loai_san IN ('San 5 nguoi', 'San 7 nguoi', 'San 11 nguoi')),

    CONSTRAINT chk_san_bong_trang_thai
        CHECK (trang_thai IN ('Hoat dong', 'Ngung hoat dong', 'Bao tri')),

    CONSTRAINT chk_san_bong_gia_thue
        CHECK (gia_thue >= 0)
);

-- 8. BANG DAT_SAN
CREATE TABLE dat_san (
    ma_dat_san VARCHAR(20) PRIMARY KEY,
    ngay_dat DATE NOT NULL,
    trang_thai_dat VARCHAR(30) DEFAULT 'Cho xac nhan',
    tien_san NUMERIC(12, 2) DEFAULT 0,
    ma_san VARCHAR(20) NOT NULL,
    ma_khach_hang VARCHAR(20) NOT NULL,
    ma_khung_gio VARCHAR(20) NOT NULL,

    CONSTRAINT fk_dat_san_san_bong
        FOREIGN KEY (ma_san)
        REFERENCES san_bong(ma_san),

    CONSTRAINT fk_dat_san_khach_hang
        FOREIGN KEY (ma_khach_hang)
        REFERENCES khach_hang(ma_khach_hang),

    CONSTRAINT fk_dat_san_khung_gio
        FOREIGN KEY (ma_khung_gio)
        REFERENCES khung_gio(ma_khung_gio),

    CONSTRAINT chk_dat_san_trang_thai
        CHECK (trang_thai_dat IN ('Cho xac nhan', 'Da xac nhan', 'Da huy')),

    CONSTRAINT chk_dat_san_tien_san
        CHECK (tien_san >= 0)
);

-- 9. BANG THANH_TOAN
CREATE TABLE thanh_toan (
    ma_thanh_toan VARCHAR(20) PRIMARY KEY,
    tong_tien_san NUMERIC(12, 2) DEFAULT 0,
    tong_tien_dich_vu NUMERIC(12, 2) DEFAULT 0,
    tong_tien NUMERIC(12, 2) DEFAULT 0,
    trang_thai_thanh_toan VARCHAR(30) DEFAULT 'Chua thanh toan',
    ma_dat_san VARCHAR(20) NOT NULL UNIQUE,

    CONSTRAINT fk_thanh_toan_dat_san
        FOREIGN KEY (ma_dat_san)
        REFERENCES dat_san(ma_dat_san),

    CONSTRAINT chk_thanh_toan_trang_thai
        CHECK (trang_thai_thanh_toan IN ('Chua thanh toan', 'Da thanh toan')),

    CONSTRAINT chk_thanh_toan_tong_tien_san
        CHECK (tong_tien_san >= 0),

    CONSTRAINT chk_thanh_toan_tong_tien_dich_vu
        CHECK (tong_tien_dich_vu >= 0),

    CONSTRAINT chk_thanh_toan_tong_tien
        CHECK (tong_tien >= 0)
);

-- 10. BANG CHI_TIET_DICH_VU
CREATE TABLE chi_tiet_dich_vu (
    ma_dat_san VARCHAR(20) NOT NULL,
    ma_dich_vu VARCHAR(20) NOT NULL,
    so_luong INTEGER NOT NULL,
    don_gia NUMERIC(12, 2) NOT NULL,
    thanh_tien NUMERIC(12, 2) DEFAULT 0,

    CONSTRAINT pk_chi_tiet_dich_vu
        PRIMARY KEY (ma_dat_san, ma_dich_vu),

    CONSTRAINT fk_chi_tiet_dich_vu_dat_san
        FOREIGN KEY (ma_dat_san)
        REFERENCES dat_san(ma_dat_san),

    CONSTRAINT fk_chi_tiet_dich_vu_dich_vu
        FOREIGN KEY (ma_dich_vu)
        REFERENCES dich_vu(ma_dich_vu),

    CONSTRAINT chk_chi_tiet_dich_vu_so_luong
        CHECK (so_luong > 0),

    CONSTRAINT chk_chi_tiet_dich_vu_don_gia
        CHECK (don_gia >= 0),

    CONSTRAINT chk_chi_tiet_dich_vu_thanh_tien
        CHECK (thanh_tien >= 0)
);

-- 11. INDEX PHU TRO CHO TRUY VAN
CREATE INDEX idx_dat_san_ma_san
ON dat_san(ma_san);

CREATE INDEX idx_dat_san_ma_khach_hang
ON dat_san(ma_khach_hang);

CREATE INDEX idx_dat_san_ngay_khung_gio
ON dat_san(ngay_dat, ma_khung_gio);

CREATE INDEX idx_san_bong_ma_khu_vuc
ON san_bong(ma_khu_vuc);

CREATE INDEX idx_san_bong_loai_san
ON san_bong(loai_san);

CREATE INDEX idx_thanh_toan_trang_thai
ON thanh_toan(trang_thai_thanh_toan);
