const db = require('../config/database');

const BOOKING_DETAIL_SELECT = `
  SELECT
    ds.ma_dat_san,
    ds.ngay_dat,
    ds.trang_thai_dat,
    ds.tien_san,
    ds.ma_san,
    ds.ma_khach_hang,
    ds.ma_khung_gio,
    sb.ten_san,
    sb.dia_chi,
    sb.loai_san,
    sb.gia_thue,
    sb.image_url,
    sb.ma_chu_san,
    cs.ho_va_ten AS ten_chu_san,
    cs.sdt AS sdt_chu_san,
    kv.ma_khu_vuc,
    kv.ten_khu_vuc,
    kv.quan_huyen,
    TO_CHAR(kg.gio_bat_dau, 'HH24:MI') AS gio_bat_dau,
    TO_CHAR(kg.gio_ket_thuc, 'HH24:MI') AS gio_ket_thuc,
    kg.la_gio_diem,
    tt.ma_thanh_toan,
    tt.tong_tien_san,
    tt.tong_tien_dich_vu,
    tt.tong_tien,
    tt.trang_thai_thanh_toan,
    COUNT(ct.ma_dich_vu)::INTEGER AS so_loai_dich_vu
  FROM dat_san ds
  JOIN san_bong sb ON sb.ma_san = ds.ma_san
  JOIN chu_san cs ON cs.ma_chu_san = sb.ma_chu_san
  JOIN khu_vuc kv ON kv.ma_khu_vuc = sb.ma_khu_vuc
  JOIN khung_gio kg ON kg.ma_khung_gio = ds.ma_khung_gio
  LEFT JOIN thanh_toan tt ON tt.ma_dat_san = ds.ma_dat_san
  LEFT JOIN chi_tiet_dich_vu ct ON ct.ma_dat_san = ds.ma_dat_san
`;

const BOOKING_GROUP_BY = `
  GROUP BY
    ds.ma_dat_san,
    ds.ngay_dat,
    ds.trang_thai_dat,
    ds.tien_san,
    ds.ma_san,
    ds.ma_khach_hang,
    ds.ma_khung_gio,
    sb.ten_san,
    sb.dia_chi,
    sb.loai_san,
    sb.gia_thue,
    sb.image_url,
    sb.ma_chu_san,
    cs.ho_va_ten,
    cs.sdt,
    kv.ma_khu_vuc,
    kv.ten_khu_vuc,
    kv.quan_huyen,
    kg.gio_bat_dau,
    kg.gio_ket_thuc,
    kg.la_gio_diem,
    tt.ma_thanh_toan,
    tt.tong_tien_san,
    tt.tong_tien_dich_vu,
    tt.tong_tien,
    tt.trang_thai_thanh_toan
`;

async function findCustomerBookingById(bookingId, customerId, executor = db) {
  const result = await executor.query(
    `${BOOKING_DETAIL_SELECT}
     WHERE ds.ma_dat_san = $1
       AND ds.ma_khach_hang = $2
     ${BOOKING_GROUP_BY}
     LIMIT 1`,
    [bookingId, customerId],
  );

  return result.rows[0] || null;
}

async function nextBookingId(executor) {
  const result = await executor.query(`
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(ma_dat_san FROM 3) AS INTEGER)),
      0
    ) + 1 AS next_number
    FROM dat_san
    WHERE ma_dat_san ~ '^DS[0-9]+$'
  `);

  const nextNumber = Number(result.rows[0].next_number);
  return `DS${String(nextNumber).padStart(3, '0')}`;
}

module.exports = {
  async healthCheck() {
    const result = await db.query('SELECT NOW() AS server_time');
    return result.rows[0];
  },

  async findCustomerBookings({ customerId, status, limit, offset }) {
    const params = [customerId];
    const conditions = ['ds.ma_khach_hang = $1'];

    if (status) {
      params.push(status);
      conditions.push(`ds.trang_thai_dat = $${params.length}`);
    }

    const whereSql = conditions.join(' AND ');
    const countResult = await db.query(
      `SELECT COUNT(*)::INTEGER AS total
       FROM dat_san ds
       WHERE ${whereSql}`,
      params,
    );

    const dataParams = [...params, limit, offset];
    const limitPosition = params.length + 1;
    const offsetPosition = params.length + 2;
    const dataResult = await db.query(
      `${BOOKING_DETAIL_SELECT}
       WHERE ${whereSql}
       ${BOOKING_GROUP_BY}
       ORDER BY ds.ngay_dat DESC, kg.gio_bat_dau DESC, ds.ma_dat_san DESC
       LIMIT $${limitPosition}
       OFFSET $${offsetPosition}`,
      dataParams,
    );

    return {
      rows: dataResult.rows,
      total: Number(countResult.rows[0].total),
    };
  },

  findCustomerBookingById,

  async createBooking({ customerId, pitchId, slotId, bookingDate }) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const slotLockKey = `booking-slot:${pitchId}:${bookingDate}:${slotId}`;
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [slotLockKey]);
      await client.query("SELECT pg_advisory_xact_lock(hashtext('booking-id-generation'))");

      const bookingId = await nextBookingId(client);
      const functionResult = await client.query(
        'SELECT fn_dat_san_bong($1, $2, $3, $4, $5::DATE) AS result',
        [bookingId, customerId, pitchId, slotId, bookingDate],
      );
      const message = functionResult.rows[0]?.result || '';

      if (message !== 'Dat san thanh cong') {
        const error = new Error(message || 'Không thể tạo đơn đặt sân.');
        error.code = 'BOOKING_FUNCTION_FAILED';
        error.functionMessage = message;
        throw error;
      }

      const booking = await findCustomerBookingById(bookingId, customerId, client);
      await client.query('COMMIT');
      return booking;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  async cancelBooking({ bookingId, customerId }) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`booking:${bookingId}`]);

      const ownerResult = await client.query(
        `SELECT ma_dat_san
         FROM dat_san
         WHERE ma_dat_san = $1
           AND ma_khach_hang = $2
         FOR UPDATE`,
        [bookingId, customerId],
      );

      if (!ownerResult.rowCount) {
        const error = new Error('Không tìm thấy đơn đặt sân thuộc tài khoản này.');
        error.code = 'BOOKING_NOT_FOUND';
        throw error;
      }

      const functionResult = await client.query(
        'SELECT fn_huy_don_dat_san($1) AS result',
        [bookingId],
      );
      const message = functionResult.rows[0]?.result || '';

      if (message !== 'Huy don dat san thanh cong') {
        const error = new Error(message || 'Không thể hủy đơn đặt sân.');
        error.code = 'CANCEL_FUNCTION_FAILED';
        error.functionMessage = message;
        throw error;
      }

      const booking = await findCustomerBookingById(bookingId, customerId, client);
      await client.query('COMMIT');
      return booking;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },
};
