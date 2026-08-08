const db = require('../config/database');

const INVOICE_SELECT = `
  SELECT
    ds.ma_dat_san,
    ds.ngay_dat,
    ds.trang_thai_dat,
    ds.ma_khach_hang,
    ds.ma_san,
    sb.ten_san,
    sb.dia_chi,
    sb.loai_san,
    sb.image_url,
    TO_CHAR(kg.gio_bat_dau, 'HH24:MI') AS gio_bat_dau,
    TO_CHAR(kg.gio_ket_thuc, 'HH24:MI') AS gio_ket_thuc,
    tt.ma_thanh_toan,
    tt.tong_tien_san,
    tt.tong_tien_dich_vu,
    tt.tong_tien,
    tt.trang_thai_thanh_toan
  FROM dat_san ds
  JOIN san_bong sb ON sb.ma_san = ds.ma_san
  JOIN khung_gio kg ON kg.ma_khung_gio = ds.ma_khung_gio
  LEFT JOIN thanh_toan tt ON tt.ma_dat_san = ds.ma_dat_san
`;

async function findInvoice(bookingId, customerId, executor = db) {
  const result = await executor.query(
    `${INVOICE_SELECT}
     WHERE ds.ma_dat_san = $1
       AND ds.ma_khach_hang = $2
     LIMIT 1`,
    [bookingId, customerId],
  );
  return result.rows[0] || null;
}

async function findSelectedServices(bookingId, executor = db) {
  const result = await executor.query(
    `SELECT
       ct.ma_dich_vu,
       dv.ten_dv,
       ct.so_luong,
       ct.don_gia,
       ct.thanh_tien
     FROM chi_tiet_dich_vu ct
     JOIN dich_vu dv ON dv.ma_dich_vu = ct.ma_dich_vu
     WHERE ct.ma_dat_san = $1
     ORDER BY dv.ten_dv, ct.ma_dich_vu`,
    [bookingId],
  );
  return result.rows;
}

async function lockEditableInvoice(client, bookingId, customerId) {
  const result = await client.query(
    `SELECT
       ds.ma_dat_san,
       ds.trang_thai_dat,
       tt.trang_thai_thanh_toan
     FROM dat_san ds
     JOIN thanh_toan tt ON tt.ma_dat_san = ds.ma_dat_san
     WHERE ds.ma_dat_san = $1
       AND ds.ma_khach_hang = $2
     FOR UPDATE OF ds, tt`,
    [bookingId, customerId],
  );

  if (!result.rowCount) {
    const error = new Error('Không tìm thấy hóa đơn thuộc tài khoản này.');
    error.code = 'INVOICE_NOT_FOUND';
    throw error;
  }

  const invoice = result.rows[0];
  if (invoice.trang_thai_dat === 'Da huy') {
    const error = new Error('Đơn đã hủy nên không thể thay đổi hóa đơn.');
    error.code = 'BOOKING_CANCELLED';
    throw error;
  }
  if (invoice.trang_thai_dat !== 'Da xac nhan') {
    const error = new Error('Chủ sân cần xác nhận đơn trước khi chọn dịch vụ hoặc thanh toán.');
    error.code = 'BOOKING_NOT_CONFIRMED';
    throw error;
  }
  if (invoice.trang_thai_thanh_toan === 'Da thanh toan') {
    const error = new Error('Hóa đơn đã thanh toán nên không thể thay đổi.');
    error.code = 'INVOICE_ALREADY_PAID';
    throw error;
  }

  return invoice;
}

module.exports = {
  async healthCheck() {
    const result = await db.query('SELECT NOW() AS server_time');
    return result.rows[0];
  },

  async findServiceCatalog() {
    const result = await db.query(
      `SELECT ma_dich_vu, ten_dv, don_gia
       FROM dich_vu
       ORDER BY ma_dich_vu`,
    );
    return result.rows;
  },

  findInvoice,
  findSelectedServices,

  async getInvoiceBundle(bookingId, customerId, executor = db) {
    const [invoice, services] = await Promise.all([
      findInvoice(bookingId, customerId, executor),
      findSelectedServices(bookingId, executor),
    ]);
    return { invoice, services };
  },

  async addService({ bookingId, customerId, serviceId, quantity }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`invoice:${bookingId}`]);
      await lockEditableInvoice(client, bookingId, customerId);

      const functionResult = await client.query(
        'SELECT fn_them_dich_vu_cho_don($1, $2, $3) AS result',
        [bookingId, serviceId, quantity],
      );
      const message = functionResult.rows[0]?.result || '';
      if (message !== 'Them dich vu vao don thanh cong') {
        const error = new Error(message || 'Không thể thêm dịch vụ vào đơn.');
        error.code = 'ADD_SERVICE_FUNCTION_FAILED';
        error.functionMessage = message;
        throw error;
      }

      const bundle = {
        invoice: await findInvoice(bookingId, customerId, client),
        services: await findSelectedServices(bookingId, client),
      };
      await client.query('COMMIT');
      return bundle;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  async removeService({ bookingId, customerId, serviceId }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`invoice:${bookingId}`]);
      await lockEditableInvoice(client, bookingId, customerId);

      const result = await client.query(
        `DELETE FROM chi_tiet_dich_vu
         WHERE ma_dat_san = $1
           AND ma_dich_vu = $2`,
        [bookingId, serviceId],
      );
      if (!result.rowCount) {
        const error = new Error('Dịch vụ không có trong đơn đặt sân.');
        error.code = 'BOOKING_SERVICE_NOT_FOUND';
        throw error;
      }

      const bundle = {
        invoice: await findInvoice(bookingId, customerId, client),
        services: await findSelectedServices(bookingId, client),
      };
      await client.query('COMMIT');
      return bundle;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  async payInvoice({ bookingId, customerId }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`invoice:${bookingId}`]);
      await lockEditableInvoice(client, bookingId, customerId);

      const functionResult = await client.query(
        'SELECT fn_thanh_toan_hoa_don($1) AS result',
        [bookingId],
      );
      const message = functionResult.rows[0]?.result || '';
      if (message !== 'Thanh toan hoa don thanh cong') {
        const error = new Error(message || 'Không thể thanh toán hóa đơn.');
        error.code = 'PAYMENT_FUNCTION_FAILED';
        error.functionMessage = message;
        throw error;
      }

      const bundle = {
        invoice: await findInvoice(bookingId, customerId, client),
        services: await findSelectedServices(bookingId, client),
      };
      await client.query('COMMIT');
      return bundle;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },
};
