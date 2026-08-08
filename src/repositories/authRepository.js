const db = require('../config/database');

const ACCOUNT_SELECT = `
  SELECT
    tk.ma_tai_khoan,
    tk.ten_dang_nhap,
    tk.mat_khau,
    tk.vai_tro,
    tk.trang_thai,
    kh.ma_khach_hang,
    cs.ma_chu_san,
    COALESCE(kh.ho_va_ten, cs.ho_va_ten, 'Quản trị viên') AS ho_va_ten,
    COALESCE(kh.sdt, cs.sdt) AS sdt
  FROM tai_khoan tk
  LEFT JOIN khach_hang kh
    ON kh.ma_tai_khoan = tk.ma_tai_khoan
  LEFT JOIN chu_san cs
    ON cs.ma_tai_khoan = tk.ma_tai_khoan
`;

async function findAccountByUsername(username, executor = db) {
  const result = await executor.query(
    `${ACCOUNT_SELECT}
     WHERE LOWER(tk.ten_dang_nhap) = LOWER($1)
     LIMIT 1`,
    [username],
  );

  return result.rows[0] || null;
}

async function findAccountById(accountId, executor = db) {
  const result = await executor.query(
    `${ACCOUNT_SELECT}
     WHERE tk.ma_tai_khoan = $1
     LIMIT 1`,
    [accountId],
  );

  return result.rows[0] || null;
}

async function usernameExists(username) {
  const result = await db.query(
    `SELECT EXISTS (
       SELECT 1
       FROM tai_khoan
       WHERE LOWER(ten_dang_nhap) = LOWER($1)
     ) AS exists`,
    [username],
  );

  return result.rows[0].exists;
}

async function registerCustomer({ username, passwordHash, fullName, phone }) {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const functionResult = await client.query(
      'SELECT fn_dang_ky_khach_hang($1, $2, $3, $4) AS result',
      [username, passwordHash, fullName, phone],
    );

    const message = functionResult.rows[0]?.result || '';
    if (!message.startsWith('Dang ky khach hang thanh cong:')) {
      const error = new Error(message || 'Không thể đăng ký tài khoản');
      error.code = 'REGISTER_FUNCTION_FAILED';
      throw error;
    }

    const account = await findAccountByUsername(username, client);
    await client.query('COMMIT');

    return account;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function updatePasswordHash(accountId, passwordHash) {
  await db.query(
    `UPDATE tai_khoan
     SET mat_khau = $2
     WHERE ma_tai_khoan = $1`,
    [accountId, passwordHash],
  );
}

async function healthCheck() {
  const result = await db.query('SELECT NOW() AS server_time');
  return result.rows[0];
}

module.exports = {
  findAccountById,
  findAccountByUsername,
  healthCheck,
  registerCustomer,
  updatePasswordHash,
  usernameExists,
};
