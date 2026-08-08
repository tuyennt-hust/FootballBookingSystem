const db = require('../config/database');

const OWNER_PITCH_SELECT = `
  SELECT
    sb.ma_san,
    sb.ten_san,
    sb.dia_chi,
    sb.loai_san,
    sb.gia_thue,
    sb.trang_thai,
    sb.ma_chu_san,
    sb.ma_khu_vuc,
    sb.image_url,
    kv.ten_khu_vuc,
    kv.quan_huyen,
    COUNT(ds.ma_dat_san) FILTER (
      WHERE ds.trang_thai_dat <> 'Da huy'
        AND ds.ngay_dat >= CURRENT_DATE
    )::INTEGER AS so_don_sap_toi,
    COUNT(ds.ma_dat_san) FILTER (
      WHERE ds.trang_thai_dat = 'Cho xac nhan'
        AND ds.ngay_dat >= CURRENT_DATE
    )::INTEGER AS so_don_cho_xac_nhan
  FROM san_bong sb
  JOIN khu_vuc kv ON kv.ma_khu_vuc = sb.ma_khu_vuc
  LEFT JOIN dat_san ds ON ds.ma_san = sb.ma_san
`;

const OWNER_PITCH_GROUP_BY = `
  GROUP BY
    sb.ma_san,
    sb.ten_san,
    sb.dia_chi,
    sb.loai_san,
    sb.gia_thue,
    sb.trang_thai,
    sb.ma_chu_san,
    sb.ma_khu_vuc,
    sb.image_url,
    kv.ten_khu_vuc,
    kv.quan_huyen
`;

const OWNER_BOOKING_SELECT = `
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
    kh.ho_va_ten AS ten_khach_hang,
    kh.sdt AS sdt_khach_hang,
    TO_CHAR(kg.gio_bat_dau, 'HH24:MI') AS gio_bat_dau,
    TO_CHAR(kg.gio_ket_thuc, 'HH24:MI') AS gio_ket_thuc,
    kg.la_gio_diem,
    tt.ma_thanh_toan,
    tt.tong_tien_san,
    tt.tong_tien_dich_vu,
    tt.tong_tien,
    tt.trang_thai_thanh_toan,
    (ds.ngay_dat + kg.gio_bat_dau) AS bat_dau_luc
  FROM dat_san ds
  JOIN san_bong sb ON sb.ma_san = ds.ma_san
  JOIN khach_hang kh ON kh.ma_khach_hang = ds.ma_khach_hang
  JOIN khung_gio kg ON kg.ma_khung_gio = ds.ma_khung_gio
  LEFT JOIN thanh_toan tt ON tt.ma_dat_san = ds.ma_dat_san
`;

async function nextPitchId(executor) {
  const result = await executor.query(`
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(ma_san FROM 2) AS INTEGER)),
      0
    ) + 1 AS next_number
    FROM san_bong
    WHERE ma_san ~ '^S[0-9]+$'
  `);

  const nextNumber = Number(result.rows[0].next_number);
  return `S${String(nextNumber).padStart(2, '0')}`;
}

async function findOwnerPitchById(pitchId, ownerId, executor = db) {
  const result = await executor.query(
    `${OWNER_PITCH_SELECT}
     WHERE sb.ma_san = $1
       AND sb.ma_chu_san = $2
     ${OWNER_PITCH_GROUP_BY}
     LIMIT 1`,
    [pitchId, ownerId],
  );

  return result.rows[0] || null;
}

async function findOwnerBookingById(bookingId, ownerId, executor = db) {
  const result = await executor.query(
    `${OWNER_BOOKING_SELECT}
     WHERE ds.ma_dat_san = $1
       AND sb.ma_chu_san = $2
     LIMIT 1`,
    [bookingId, ownerId],
  );

  return result.rows[0] || null;
}

module.exports = {
  async healthCheck() {
    const result = await db.query('SELECT NOW() AS server_time');
    return result.rows[0];
  },

  async getDashboard(ownerId) {
    const [statsResult, recentBookingsResult, pitchStatusResult] = await Promise.all([
      db.query(`
        SELECT
          (SELECT COUNT(*)::INTEGER
           FROM san_bong sb
           WHERE sb.ma_chu_san = $1) AS tong_so_san,
          (SELECT COUNT(*)::INTEGER
           FROM san_bong sb
           WHERE sb.ma_chu_san = $1
             AND sb.trang_thai = 'Hoat dong') AS san_hoat_dong,
          (SELECT COUNT(*)::INTEGER
           FROM dat_san ds
           JOIN san_bong sb ON sb.ma_san = ds.ma_san
           WHERE sb.ma_chu_san = $1
             AND ds.trang_thai_dat = 'Cho xac nhan'
             AND ds.ngay_dat >= CURRENT_DATE) AS don_cho_xac_nhan,
          (SELECT COUNT(*)::INTEGER
           FROM dat_san ds
           JOIN san_bong sb ON sb.ma_san = ds.ma_san
           WHERE sb.ma_chu_san = $1
             AND ds.ngay_dat = CURRENT_DATE
             AND ds.trang_thai_dat <> 'Da huy') AS don_hom_nay,
          (SELECT COALESCE(SUM(tt.tong_tien), 0)
           FROM thanh_toan tt
           JOIN dat_san ds ON ds.ma_dat_san = tt.ma_dat_san
           JOIN san_bong sb ON sb.ma_san = ds.ma_san
           WHERE sb.ma_chu_san = $1
             AND tt.trang_thai_thanh_toan = 'Da thanh toan') AS doanh_thu_da_thanh_toan
      `, [ownerId]),
      db.query(
        `${OWNER_BOOKING_SELECT}
         WHERE sb.ma_chu_san = $1
           AND ds.trang_thai_dat <> 'Da huy'
           AND (ds.ngay_dat + kg.gio_bat_dau) >= NOW()
         ORDER BY ds.ngay_dat, kg.gio_bat_dau
         LIMIT 6`,
        [ownerId],
      ),
      db.query(`
        SELECT trang_thai, COUNT(*)::INTEGER AS so_luong
        FROM san_bong
        WHERE ma_chu_san = $1
        GROUP BY trang_thai
      `, [ownerId]),
    ]);

    return {
      stats: statsResult.rows[0],
      recentBookings: recentBookingsResult.rows,
      pitchStatus: pitchStatusResult.rows,
    };
  },

  async findAreas() {
    const result = await db.query(`
      SELECT ma_khu_vuc, ten_khu_vuc, quan_huyen
      FROM khu_vuc
      ORDER BY quan_huyen, ten_khu_vuc
    `);
    return result.rows;
  },

  async findOwnerPitches(ownerId) {
    const result = await db.query(
      `${OWNER_PITCH_SELECT}
       WHERE sb.ma_chu_san = $1
       ${OWNER_PITCH_GROUP_BY}
       ORDER BY sb.ma_san`,
      [ownerId],
    );
    return result.rows;
  },

  findOwnerPitchById,

  async createPitch({ ownerId, name, address, pitchType, price, areaId, imageUrl }) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('pitch-id-generation'))");

      const pitchId = await nextPitchId(client);
      const functionResult = await client.query(
        'SELECT fn_them_san_bong($1, $2, $3, $4, $5, $6, $7) AS result',
        [pitchId, name, address, pitchType, price, ownerId, areaId],
      );
      const message = functionResult.rows[0]?.result || '';

      if (message !== 'Them san bong thanh cong') {
        const error = new Error(message || 'Không thể thêm sân bóng.');
        error.code = 'CREATE_PITCH_FUNCTION_FAILED';
        error.functionMessage = message;
        throw error;
      }

      if (imageUrl) {
        await client.query(
          'UPDATE san_bong SET image_url = $1 WHERE ma_san = $2',
          [imageUrl, pitchId],
        );
      }

      const pitch = await findOwnerPitchById(pitchId, ownerId, client);
      await client.query('COMMIT');
      return pitch;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  async updatePitch({ pitchId, ownerId, name, address, pitchType, price, areaId, imageUrl }) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');
      const lockResult = await client.query(
        `SELECT ma_san, image_url
         FROM san_bong
         WHERE ma_san = $1 AND ma_chu_san = $2
         FOR UPDATE`,
        [pitchId, ownerId],
      );

      if (!lockResult.rowCount) {
        const error = new Error('Không tìm thấy sân thuộc tài khoản chủ sân này.');
        error.code = 'OWNER_PITCH_NOT_FOUND';
        throw error;
      }

      const previousImageUrl = lockResult.rows[0].image_url || null;
      await client.query(`
        UPDATE san_bong
        SET ten_san = $1,
            dia_chi = $2,
            loai_san = $3,
            gia_thue = $4,
            ma_khu_vuc = $5,
            image_url = COALESCE($6, image_url)
        WHERE ma_san = $7
          AND ma_chu_san = $8
      `, [name, address, pitchType, price, areaId, imageUrl, pitchId, ownerId]);

      const pitch = await findOwnerPitchById(pitchId, ownerId, client);
      await client.query('COMMIT');
      return { pitch, previousImageUrl };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  async updatePitchStatus({ pitchId, ownerId, status }) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');
      const lockResult = await client.query(
        `SELECT ma_san, trang_thai
         FROM san_bong
         WHERE ma_san = $1 AND ma_chu_san = $2
         FOR UPDATE`,
        [pitchId, ownerId],
      );

      if (!lockResult.rowCount) {
        const error = new Error('Không tìm thấy sân thuộc tài khoản chủ sân này.');
        error.code = 'OWNER_PITCH_NOT_FOUND';
        throw error;
      }

      if (lockResult.rows[0].trang_thai === status) {
        const unchangedPitch = await findOwnerPitchById(pitchId, ownerId, client);
        await client.query('COMMIT');
        return unchangedPitch;
      }

      if (status !== 'Hoat dong') {
        const futureBookingResult = await client.query(`
          SELECT COUNT(*)::INTEGER AS total
          FROM dat_san ds
          JOIN khung_gio kg ON kg.ma_khung_gio = ds.ma_khung_gio
          WHERE ds.ma_san = $1
            AND ds.trang_thai_dat <> 'Da huy'
            AND (ds.ngay_dat + kg.gio_bat_dau) > NOW()
        `, [pitchId]);

        if (Number(futureBookingResult.rows[0].total) > 0) {
          const error = new Error('Sân còn đơn đặt trong tương lai nên chưa thể chuyển sang bảo trì hoặc ngừng hoạt động.');
          error.code = 'PITCH_HAS_FUTURE_BOOKINGS';
          throw error;
        }
      }

      if (status === 'Ngung hoat dong') {
        const result = await client.query('SELECT fn_xoa_san_bong($1) AS result', [pitchId]);
        if (result.rows[0]?.result !== 'Ngung hoat dong san thanh cong') {
          const error = new Error(result.rows[0]?.result || 'Không thể ngừng hoạt động sân.');
          error.code = 'STOP_PITCH_FUNCTION_FAILED';
          throw error;
        }
      } else {
        await client.query(
          'UPDATE san_bong SET trang_thai = $1 WHERE ma_san = $2 AND ma_chu_san = $3',
          [status, pitchId, ownerId],
        );
      }

      const pitch = await findOwnerPitchById(pitchId, ownerId, client);
      await client.query('COMMIT');
      return pitch;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  async findOwnerBookings({ ownerId, status, pitchId, limit, offset }) {
    const params = [ownerId];
    const conditions = ['sb.ma_chu_san = $1'];

    if (status) {
      params.push(status);
      conditions.push(`ds.trang_thai_dat = $${params.length}`);
    }

    if (pitchId) {
      params.push(pitchId);
      conditions.push(`ds.ma_san = $${params.length}`);
    }

    const whereSql = conditions.join(' AND ');
    const countResult = await db.query(
      `SELECT COUNT(*)::INTEGER AS total
       FROM dat_san ds
       JOIN san_bong sb ON sb.ma_san = ds.ma_san
       WHERE ${whereSql}`,
      params,
    );

    const dataParams = [...params, limit, offset];
    const dataResult = await db.query(
      `${OWNER_BOOKING_SELECT}
       WHERE ${whereSql}
       ORDER BY
         CASE WHEN ds.trang_thai_dat = 'Cho xac nhan' THEN 0 ELSE 1 END,
         ds.ngay_dat DESC,
         kg.gio_bat_dau DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      dataParams,
    );

    return {
      rows: dataResult.rows,
      total: Number(countResult.rows[0].total),
    };
  },

  findOwnerBookingById,

  async confirmBooking({ bookingId, ownerId }) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');
      const lockResult = await client.query(`
        SELECT ds.ma_dat_san, ds.trang_thai_dat,
               (ds.ngay_dat + kg.gio_bat_dau) AS bat_dau_luc
        FROM dat_san ds
        JOIN san_bong sb ON sb.ma_san = ds.ma_san
        JOIN khung_gio kg ON kg.ma_khung_gio = ds.ma_khung_gio
        WHERE ds.ma_dat_san = $1
          AND sb.ma_chu_san = $2
        FOR UPDATE OF ds
      `, [bookingId, ownerId]);

      if (!lockResult.rowCount) {
        const error = new Error('Không tìm thấy đơn đặt sân thuộc hệ thống sân của bạn.');
        error.code = 'OWNER_BOOKING_NOT_FOUND';
        throw error;
      }

      const booking = lockResult.rows[0];
      if (booking.trang_thai_dat !== 'Cho xac nhan') {
        const error = new Error('Chỉ đơn đang chờ xác nhận mới có thể xác nhận.');
        error.code = 'BOOKING_NOT_PENDING';
        throw error;
      }

      if (new Date(booking.bat_dau_luc).getTime() <= Date.now()) {
        const error = new Error('Đơn đã đến hoặc qua giờ bắt đầu nên không thể xác nhận.');
        error.code = 'BOOKING_ALREADY_STARTED';
        throw error;
      }

      const functionResult = await client.query(
        'SELECT fn_xac_nhan_don_dat_san($1) AS result',
        [bookingId],
      );
      const message = functionResult.rows[0]?.result || '';

      if (message !== 'Xac nhan don dat san thanh cong') {
        const error = new Error(message || 'Không thể xác nhận đơn đặt sân.');
        error.code = 'CONFIRM_BOOKING_FUNCTION_FAILED';
        throw error;
      }

      const confirmed = await findOwnerBookingById(bookingId, ownerId, client);
      await client.query('COMMIT');
      return confirmed;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },
};
