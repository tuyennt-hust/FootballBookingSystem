const db = require('../config/database');

const ACCOUNT_SELECT = `
  SELECT tk.ma_tai_khoan, tk.ten_dang_nhap, tk.vai_tro, tk.trang_thai,
         COALESCE(kh.ho_va_ten, cs.ho_va_ten, 'Quản trị viên') AS ho_va_ten,
         COALESCE(kh.sdt, cs.sdt) AS sdt,
         kh.ma_khach_hang, cs.ma_chu_san
  FROM tai_khoan tk
  LEFT JOIN khach_hang kh ON kh.ma_tai_khoan = tk.ma_tai_khoan
  LEFT JOIN chu_san cs ON cs.ma_tai_khoan = tk.ma_tai_khoan
`;

async function healthCheck() {
  const result = await db.query('SELECT NOW() AS server_time');
  return result.rows[0];
}

async function getDashboard() {
  const [stats, accountRoles, recentBookings, recentPayments] = await Promise.all([
    db.query(`
      SELECT
        (SELECT COUNT(*)::INTEGER FROM tai_khoan) AS tong_tai_khoan,
        (SELECT COUNT(*)::INTEGER FROM tai_khoan WHERE trang_thai = 'Bi khoa') AS tai_khoan_bi_khoa,
        (SELECT COUNT(*)::INTEGER FROM san_bong) AS tong_san,
        (SELECT COUNT(*)::INTEGER FROM san_bong WHERE trang_thai = 'Hoat dong') AS san_hoat_dong,
        (SELECT COUNT(*)::INTEGER FROM dat_san) AS tong_don,
        (SELECT COUNT(*)::INTEGER FROM dat_san WHERE trang_thai_dat = 'Cho xac nhan') AS don_cho_xac_nhan,
        (SELECT COUNT(*)::INTEGER FROM thanh_toan WHERE trang_thai_thanh_toan = 'Chua thanh toan') AS hoa_don_chua_thanh_toan,
        (SELECT COALESCE(SUM(tong_tien), 0) FROM thanh_toan WHERE trang_thai_thanh_toan = 'Da thanh toan') AS tong_doanh_thu
    `),
    db.query(`SELECT vai_tro, COUNT(*)::INTEGER AS so_luong FROM tai_khoan GROUP BY vai_tro ORDER BY vai_tro`),
    db.query(`
      SELECT v.*, cs.ho_va_ten AS ten_chu_san
      FROM v_lich_dat_san_chi_tiet v
      JOIN san_bong sb ON sb.ma_san = v.ma_san
      JOIN chu_san cs ON cs.ma_chu_san = sb.ma_chu_san
      ORDER BY v.ngay_dat DESC, v.gio_bat_dau DESC
      LIMIT 6
    `),
    db.query(`
      SELECT v.*
      FROM v_chi_tiet_hoa_don v
      ORDER BY v.ngay_dat DESC, v.ma_thanh_toan DESC
      LIMIT 6
    `),
  ]);

  return {
    stats: stats.rows[0],
    accountRoles: accountRoles.rows,
    recentBookings: recentBookings.rows,
    recentPayments: recentPayments.rows,
  };
}

async function findAccounts({ q, role, status, limit, offset }) {
  const params = [];
  const conditions = [];
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(tk.ten_dang_nhap ILIKE $${params.length} OR COALESCE(kh.ho_va_ten, cs.ho_va_ten, 'Quản trị viên') ILIKE $${params.length} OR tk.ma_tai_khoan ILIKE $${params.length})`);
  }
  if (role) {
    params.push(role);
    conditions.push(`tk.vai_tro = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`tk.trang_thai = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const count = await db.query(`SELECT COUNT(*)::INTEGER AS total FROM tai_khoan tk LEFT JOIN khach_hang kh ON kh.ma_tai_khoan=tk.ma_tai_khoan LEFT JOIN chu_san cs ON cs.ma_tai_khoan=tk.ma_tai_khoan ${where}`, params);
  const dataParams = [...params, limit, offset];
  const rows = await db.query(`${ACCOUNT_SELECT} ${where} ORDER BY CASE tk.vai_tro WHEN 'Admin' THEN 0 WHEN 'Chu san' THEN 1 ELSE 2 END, tk.ma_tai_khoan LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, dataParams);
  return { rows: rows.rows, total: Number(count.rows[0].total) };
}


async function findAccountById(accountId) {
  const result = await db.query(`${ACCOUNT_SELECT} WHERE tk.ma_tai_khoan=$1 LIMIT 1`, [accountId]);
  return result.rows[0] || null;
}

async function updateAccountStatus({ accountId, status }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(`${ACCOUNT_SELECT} WHERE tk.ma_tai_khoan=$1 FOR UPDATE OF tk`, [accountId]);
    if (!current.rowCount) {
      const error = new Error('Không tìm thấy tài khoản.');
      error.code = 'ACCOUNT_NOT_FOUND';
      throw error;
    }
    await client.query('UPDATE tai_khoan SET trang_thai=$2 WHERE ma_tai_khoan=$1', [accountId, status]);
    if (status === 'Bi khoa') {
      const sessionTable = await client.query("SELECT to_regclass('public.web_session') AS table_name");
      if (sessionTable.rows[0].table_name) {
        await client.query("DELETE FROM web_session WHERE sess->'user'->>'accountId' = $1", [accountId]);
      }
    }
    const updated = await client.query(`${ACCOUNT_SELECT} WHERE tk.ma_tai_khoan=$1`, [accountId]);
    await client.query('COMMIT');
    return updated.rows[0];
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function findAreas() {
  const result = await db.query(`
    SELECT kv.ma_khu_vuc, kv.ten_khu_vuc, kv.quan_huyen,
           COUNT(DISTINCT sb.ma_san)::INTEGER AS so_san,
           COUNT(ds.ma_dat_san)::INTEGER AS so_luot_dat
    FROM khu_vuc kv
    LEFT JOIN san_bong sb ON sb.ma_khu_vuc = kv.ma_khu_vuc
    LEFT JOIN dat_san ds ON ds.ma_san = sb.ma_san
    GROUP BY kv.ma_khu_vuc, kv.ten_khu_vuc, kv.quan_huyen
    ORDER BY kv.quan_huyen, kv.ten_khu_vuc
  `);
  return result.rows;
}

async function createArea({ name, district }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('area-id-generation'))");
    const next = await client.query(`SELECT COALESCE(MAX(NULLIF(regexp_replace(ma_khu_vuc, '\\D', '', 'g'), '')::INTEGER),0)+1 AS n FROM khu_vuc`);
    const areaId = `KV${String(next.rows[0].n).padStart(2, '0')}`;
    const result = await client.query('INSERT INTO khu_vuc(ma_khu_vuc, ten_khu_vuc, quan_huyen) VALUES($1,$2,$3) RETURNING *', [areaId, name, district]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { client.release(); }
}

async function updateArea({ areaId, name, district }) {
  const result = await db.query('UPDATE khu_vuc SET ten_khu_vuc=$2, quan_huyen=$3 WHERE ma_khu_vuc=$1 RETURNING *', [areaId, name, district]);
  return result.rows[0] || null;
}

async function deleteArea(areaId) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query('SELECT * FROM khu_vuc WHERE ma_khu_vuc=$1 FOR UPDATE', [areaId]);
    if (!locked.rowCount) {
      const error = new Error('Không tìm thấy khu vực.'); error.code = 'AREA_NOT_FOUND'; throw error;
    }
    const used = await client.query('SELECT COUNT(*)::INTEGER AS total FROM san_bong WHERE ma_khu_vuc=$1', [areaId]);
    if (Number(used.rows[0].total) > 0) {
      const error = new Error('Khu vực đang có sân bóng nên không thể xóa.'); error.code = 'AREA_IN_USE'; throw error;
    }
    await client.query('DELETE FROM khu_vuc WHERE ma_khu_vuc=$1', [areaId]);
    await client.query('COMMIT');
    return locked.rows[0];
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { client.release(); }
}

async function findPitches({ q, status, type, limit, offset }) {
  const params=[]; const conditions=[];
  if (q) { params.push(`%${q}%`); conditions.push(`(sb.ma_san ILIKE $${params.length} OR sb.ten_san ILIKE $${params.length} OR cs.ho_va_ten ILIKE $${params.length})`); }
  if (status) { params.push(status); conditions.push(`sb.trang_thai=$${params.length}`); }
  if (type) { params.push(type); conditions.push(`sb.loai_san=$${params.length}`); }
  const where=conditions.length?`WHERE ${conditions.join(' AND ')}`:'';
  const count=await db.query(`SELECT COUNT(*)::INTEGER AS total FROM san_bong sb JOIN chu_san cs ON cs.ma_chu_san=sb.ma_chu_san ${where}`,params);
  const dataParams=[...params,limit,offset];
  const rows=await db.query(`SELECT sb.*, cs.ho_va_ten AS ten_chu_san, kv.ten_khu_vuc, kv.quan_huyen, (SELECT COUNT(*)::INTEGER FROM dat_san ds WHERE ds.ma_san=sb.ma_san) AS so_luot_dat FROM san_bong sb JOIN chu_san cs ON cs.ma_chu_san=sb.ma_chu_san JOIN khu_vuc kv ON kv.ma_khu_vuc=sb.ma_khu_vuc ${where} ORDER BY sb.ma_san LIMIT $${params.length+1} OFFSET $${params.length+2}`,dataParams);
  return {rows:rows.rows,total:Number(count.rows[0].total)};
}

async function findBookings({ q, bookingStatus, paymentStatus, limit, offset }) {
  const params=[]; const conditions=[];
  if(q){params.push(`%${q}%`);conditions.push(`(v.ma_dat_san ILIKE $${params.length} OR v.ten_khach_hang ILIKE $${params.length} OR v.ten_san ILIKE $${params.length})`);}
  if(bookingStatus){params.push(bookingStatus);conditions.push(`v.trang_thai_dat=$${params.length}`);}
  if(paymentStatus){params.push(paymentStatus);conditions.push(`v.trang_thai_thanh_toan=$${params.length}`);}
  const where=conditions.length?`WHERE ${conditions.join(' AND ')}`:'';
  const count=await db.query(`SELECT COUNT(*)::INTEGER AS total FROM v_lich_dat_san_chi_tiet v ${where}`,params);
  const dataParams=[...params,limit,offset];
  const rows=await db.query(`SELECT v.*, cs.ho_va_ten AS ten_chu_san FROM v_lich_dat_san_chi_tiet v JOIN san_bong sb ON sb.ma_san=v.ma_san JOIN chu_san cs ON cs.ma_chu_san=sb.ma_chu_san ${where} ORDER BY v.ngay_dat DESC,v.gio_bat_dau DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,dataParams);
  return {rows:rows.rows,total:Number(count.rows[0].total)};
}

async function findInvoices({ status, limit, offset }) {
  const params=[]; let where='';
  if(status){params.push(status);where=`WHERE v.trang_thai_thanh_toan=$1`;}
  const count=await db.query(`SELECT COUNT(*)::INTEGER AS total FROM v_chi_tiet_hoa_don v ${where}`,params);
  const dataParams=[...params,limit,offset];
  const rows=await db.query(`SELECT v.* FROM v_chi_tiet_hoa_don v ${where} ORDER BY v.ngay_dat DESC,v.ma_thanh_toan DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,dataParams);
  return {rows:rows.rows,total:Number(count.rows[0].total)};
}

async function getStatistics() {
  const [topCustomers, customerSegments, monthly, areas, pitches, services, cancellation] = await Promise.all([
    db.query('SELECT * FROM fn_top_10_khach_hang_chi_tieu()'),
    db.query('SELECT * FROM fn_phan_loai_khach_hang()'),
    db.query('SELECT * FROM v_doanh_thu_theo_thang ORDER BY thang DESC LIMIT 12'),
    db.query('SELECT * FROM v_doanh_thu_theo_khu_vuc ORDER BY tong_doanh_thu DESC NULLS LAST LIMIT 10'),
    db.query('SELECT * FROM v_doanh_thu_theo_san ORDER BY tong_doanh_thu DESC NULLS LAST LIMIT 10'),
    db.query('SELECT * FROM v_dich_vu_ban_chay ORDER BY doanh_thu_dich_vu DESC NULLS LAST LIMIT 10'),
    db.query(`SELECT COUNT(*)::INTEGER AS tong_so_don, COUNT(*) FILTER (WHERE trang_thai_dat='Da huy')::INTEGER AS so_don_huy, CASE WHEN COUNT(*)=0 THEN 0 ELSE ROUND(COUNT(*) FILTER (WHERE trang_thai_dat='Da huy')::NUMERIC*100/COUNT(*),2) END AS ty_le_huy_phan_tram FROM dat_san`),
  ]);
  return { topCustomers:topCustomers.rows, customerSegments:customerSegments.rows, monthly:monthly.rows, areas:areas.rows, pitches:pitches.rows, services:services.rows, cancellation:cancellation.rows[0] || {} };
}

module.exports={healthCheck,getDashboard,findAccounts,findAccountById,updateAccountStatus,findAreas,createArea,updateArea,deleteArea,findPitches,findBookings,findInvoices,getStatistics};
