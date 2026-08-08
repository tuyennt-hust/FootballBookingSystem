const db = require('../config/database');

const BASE_PUBLIC_SELECT = `
  SELECT
    sb.ma_san,
    sb.ten_san,
    sb.dia_chi,
    sb.loai_san,
    sb.gia_thue,
    sb.trang_thai,
    sb.ma_chu_san,
    cs.ho_va_ten AS ten_chu_san,
    cs.sdt AS sdt_chu_san,
    sb.ma_khu_vuc,
    sb.image_url,
    kv.ten_khu_vuc,
    kv.quan_huyen
  FROM san_bong sb
  JOIN chu_san cs ON cs.ma_chu_san = sb.ma_chu_san
  JOIN khu_vuc kv ON kv.ma_khu_vuc = sb.ma_khu_vuc
`;

module.exports = {
  async healthCheck() {
    const result = await db.query('SELECT NOW() AS server_time');
    return result.rows[0];
  },

  async findFeatured(limit = 6) {
    const result = await db.query(
      `${BASE_PUBLIC_SELECT}
       WHERE sb.trang_thai = 'Hoat dong'
       ORDER BY sb.ma_san
       LIMIT $1`,
      [limit],
    );

    return result.rows;
  },

  async findAreas() {
    const result = await db.query(`
      SELECT
        kv.ma_khu_vuc,
        kv.ten_khu_vuc,
        kv.quan_huyen,
        COUNT(sb.ma_san)::INTEGER AS so_san_hoat_dong
      FROM khu_vuc kv
      LEFT JOIN san_bong sb
        ON sb.ma_khu_vuc = kv.ma_khu_vuc
       AND sb.trang_thai = 'Hoat dong'
      GROUP BY kv.ma_khu_vuc, kv.ten_khu_vuc, kv.quan_huyen
      ORDER BY kv.quan_huyen, kv.ten_khu_vuc
    `);

    return result.rows;
  },

  async getPublicStats() {
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE trang_thai = 'Hoat dong')::INTEGER AS so_san_hoat_dong,
        COUNT(DISTINCT ma_khu_vuc) FILTER (WHERE trang_thai = 'Hoat dong')::INTEGER AS so_khu_vuc,
        COUNT(DISTINCT ma_chu_san) FILTER (WHERE trang_thai = 'Hoat dong')::INTEGER AS so_chu_san
      FROM san_bong
    `);

    return result.rows[0];
  },

  async findPublicPitches({ keyword, areaId, pitchType, sortSql, limit, offset }) {
    const conditions = ["sb.trang_thai = 'Hoat dong'"];
    const filterParams = [];

    if (keyword) {
      filterParams.push(`%${keyword}%`);
      conditions.push(`(
        sb.ten_san ILIKE $${filterParams.length}
        OR COALESCE(sb.dia_chi, '') ILIKE $${filterParams.length}
        OR kv.ten_khu_vuc ILIKE $${filterParams.length}
        OR kv.quan_huyen ILIKE $${filterParams.length}
      )`);
    }

    if (areaId) {
      filterParams.push(areaId);
      conditions.push(`sb.ma_khu_vuc = $${filterParams.length}`);
    }

    if (pitchType) {
      filterParams.push(pitchType);
      conditions.push(`sb.loai_san = $${filterParams.length}`);
    }

    const whereSql = conditions.join(' AND ');
    const dataParams = [...filterParams, limit, offset];
    const limitParam = `$${filterParams.length + 1}`;
    const offsetParam = `$${filterParams.length + 2}`;

    const [dataResult, countResult] = await Promise.all([
      db.query(
        `${BASE_PUBLIC_SELECT}
         WHERE ${whereSql}
         ORDER BY ${sortSql}
         LIMIT ${limitParam}
         OFFSET ${offsetParam}`,
        dataParams,
      ),
      db.query(
        `SELECT COUNT(*)::INTEGER AS total
         FROM san_bong sb
         JOIN khu_vuc kv ON kv.ma_khu_vuc = sb.ma_khu_vuc
         WHERE ${whereSql}`,
        filterParams,
      ),
    ]);

    return {
      rows: dataResult.rows,
      total: Number(countResult.rows[0].total),
    };
  },

  async findPublicById(pitchId) {
    const result = await db.query(
      `${BASE_PUBLIC_SELECT}
       WHERE sb.ma_san = $1
         AND sb.trang_thai = 'Hoat dong'
       LIMIT 1`,
      [pitchId],
    );

    return result.rows[0] || null;
  },

  async findAvailability(pitchId, bookingDate) {
    const result = await db.query(`
      SELECT
        kg.ma_khung_gio,
        TO_CHAR(kg.gio_bat_dau, 'HH24:MI') AS gio_bat_dau,
        TO_CHAR(kg.gio_ket_thuc, 'HH24:MI') AS gio_ket_thuc,
        kg.la_gio_diem,
        NOT EXISTS (
          SELECT 1
          FROM dat_san ds
          WHERE ds.ma_san = $1
            AND ds.ma_khung_gio = kg.ma_khung_gio
            AND ds.ngay_dat = $2::DATE
            AND ds.trang_thai_dat <> 'Da huy'
        ) AS con_trong,
        ROUND(
          CASE
            WHEN kg.la_gio_diem THEN sb.gia_thue * 1.2
            ELSE sb.gia_thue
          END,
          2
        ) AS gia_ca
      FROM khung_gio kg
      CROSS JOIN san_bong sb
      WHERE sb.ma_san = $1
        AND sb.trang_thai = 'Hoat dong'
      ORDER BY kg.gio_bat_dau
    `, [pitchId, bookingDate]);

    return result.rows;
  },

  async findRelated(pitchId, areaId, limit = 3) {
    const result = await db.query(
      `${BASE_PUBLIC_SELECT}
       WHERE sb.trang_thai = 'Hoat dong'
         AND sb.ma_san <> $1
         AND sb.ma_khu_vuc = $2
       ORDER BY sb.ten_san
       LIMIT $3`,
      [pitchId, areaId, limit],
    );

    return result.rows;
  },
};
