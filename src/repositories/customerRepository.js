const db = require('../config/database');

async function healthCheck() {
  const result = await db.query('SELECT NOW() AS server_time');
  return result.rows[0];
}

async function getSummary(customerId) {
  const result = await db.query(`
    SELECT
      COUNT(ds.ma_dat_san)::INTEGER AS tong_don,
      COUNT(ds.ma_dat_san) FILTER (WHERE ds.trang_thai_dat = 'Cho xac nhan')::INTEGER AS cho_xac_nhan,
      COUNT(ds.ma_dat_san) FILTER (WHERE ds.trang_thai_dat = 'Da xac nhan')::INTEGER AS da_xac_nhan,
      COUNT(ds.ma_dat_san) FILTER (WHERE ds.trang_thai_dat = 'Da huy')::INTEGER AS da_huy,
      COUNT(tt.ma_thanh_toan) FILTER (WHERE tt.trang_thai_thanh_toan = 'Da thanh toan')::INTEGER AS hoa_don_da_thanh_toan,
      COALESCE(SUM(tt.tong_tien) FILTER (WHERE tt.trang_thai_thanh_toan = 'Da thanh toan'), 0) AS tong_da_chi
    FROM dat_san ds
    LEFT JOIN thanh_toan tt ON tt.ma_dat_san = ds.ma_dat_san
    WHERE ds.ma_khach_hang = $1
  `, [customerId]);
  return result.rows[0];
}

module.exports = { healthCheck, getSummary };
