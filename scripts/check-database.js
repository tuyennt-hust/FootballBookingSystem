const db = require('../src/config/database');

const REQUIRED_TABLES = [
  'tai_khoan', 'khach_hang', 'chu_san', 'khu_vuc', 'khung_gio',
  'dich_vu', 'san_bong', 'dat_san', 'thanh_toan', 'chi_tiet_dich_vu',
];
const REQUIRED_VIEWS = [
  'v_lich_dat_san_chi_tiet', 'v_doanh_thu_theo_san', 'v_doanh_thu_theo_thang',
  'v_doanh_thu_theo_khu_vuc', 'v_dich_vu_ban_chay', 'v_chi_tiet_hoa_don',
];
const REQUIRED_FUNCTIONS = [
  'fn_dang_ky_khach_hang', 'fn_dang_nhap', 'fn_dat_san_bong', 'fn_huy_don_dat_san',
  'fn_xac_nhan_don_dat_san', 'fn_them_dich_vu_cho_don', 'fn_thanh_toan_hoa_don',
];
const REQUIRED_TRIGGERS = [
  'tg_kiem_tra_trung_lich', 'tg_tinh_tien_san', 'tg_tao_hoa_don',
  'tg_tinh_tien_chi_tiet_dich_vu', 'tg_cap_nhat_tien_dich_vu',
];

async function checkCatalog(kind, names, sql) {
  const result = await db.query(sql, [names]);
  const found = new Set(result.rows.map((row) => row.name));
  const missing = names.filter((name) => !found.has(name));
  if (missing.length) throw new Error(`${kind} thiếu: ${missing.join(', ')}`);
  console.log(`[DB CHECK] ${kind}: ${names.length}/${names.length}`);
}

async function assertZero(label, sql) {
  const result = await db.query(sql);
  const count = Number(result.rows[0].total || 0);
  if (count !== 0) throw new Error(`${label}: phát hiện ${count} bản ghi vi phạm`);
  console.log(`[DB CHECK] ${label}: OK`);
}

async function main() {
  const info = await db.testConnection();
  console.log(`[DB CHECK] Database: ${info.database_name} | User: ${info.database_user}`);

  await checkCatalog('Bảng', REQUIRED_TABLES, `
    SELECT table_name AS name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ANY($1::text[])
  `);
  await checkCatalog('View', REQUIRED_VIEWS, `
    SELECT table_name AS name
    FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = ANY($1::text[])
  `);
  await checkCatalog('Function', REQUIRED_FUNCTIONS, `
    SELECT DISTINCT p.proname AS name
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY($1::text[])
  `);
  await checkCatalog('Trigger', REQUIRED_TRIGGERS, `
    SELECT DISTINCT tgname AS name
    FROM pg_trigger
    WHERE NOT tgisinternal AND tgname = ANY($1::text[])
  `);

  await assertZero('Không có slot hoạt động bị đặt trùng', `
    SELECT COUNT(*)::INTEGER AS total
    FROM (
      SELECT ma_san, ngay_dat, ma_khung_gio
      FROM dat_san
      WHERE trang_thai_dat <> 'Da huy'
      GROUP BY ma_san, ngay_dat, ma_khung_gio
      HAVING COUNT(*) > 1
    ) duplicated
  `);
  await assertZero('Mỗi đơn đều có đúng một hóa đơn', `
    SELECT COUNT(*)::INTEGER AS total
    FROM dat_san ds
    LEFT JOIN thanh_toan tt ON tt.ma_dat_san = ds.ma_dat_san
    WHERE tt.ma_dat_san IS NULL
  `);
  await assertZero('Tổng hóa đơn khớp tiền sân + dịch vụ', `
    SELECT COUNT(*)::INTEGER AS total
    FROM thanh_toan
    WHERE ABS(tong_tien - (tong_tien_san + tong_tien_dich_vu)) > 0.01
  `);
  await assertZero('Không có chi tiết dịch vụ sai thành tiền', `
    SELECT COUNT(*)::INTEGER AS total
    FROM chi_tiet_dich_vu
    WHERE ABS(thanh_tien - (so_luong * don_gia)) > 0.01
  `);

  const counts = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM san_bong) AS pitches,
      (SELECT COUNT(*) FROM dat_san) AS bookings,
      (SELECT COUNT(*) FROM thanh_toan WHERE trang_thai_thanh_toan='Da thanh toan') AS paid_invoices
  `);
  console.log(`[DB CHECK] Dữ liệu: ${counts.rows[0].pitches} sân, ${counts.rows[0].bookings} đơn, ${counts.rows[0].paid_invoices} hóa đơn đã thanh toán.`);
  console.log('[DB CHECK] Tất cả kiểm tra database đạt.');
}

main()
  .catch((error) => {
    console.error('[DB CHECK] Thất bại:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.close().catch(() => {}));
