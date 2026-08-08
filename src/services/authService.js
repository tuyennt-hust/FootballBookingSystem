const bcrypt = require('bcryptjs');
const authRepository = require('../repositories/authRepository');
const AppError = require('../utils/AppError');

const BCRYPT_ROUNDS = 12;
const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;
const PHONE_PATTERN = /^0\d{9,10}$/;

const ROLE_LABELS = {
  Admin: 'Quản trị viên',
  'Chu san': 'Chủ sân',
  'Khach hang': 'Khách hàng',
};

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function toSessionUser(account) {
  return {
    accountId: account.ma_tai_khoan,
    username: account.ten_dang_nhap,
    role: account.vai_tro,
    roleLabel: ROLE_LABELS[account.vai_tro] || account.vai_tro,
    fullName: account.ho_va_ten,
    phone: account.sdt || null,
    customerId: account.ma_khach_hang || null,
    ownerId: account.ma_chu_san || null,
  };
}

function validateUsername(username) {
  if (username.length < 4 || username.length > 50) {
    throw new AppError('Tên đăng nhập phải có từ 4 đến 50 ký tự.', 422, 'INVALID_USERNAME');
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new AppError(
      'Tên đăng nhập chỉ được chứa chữ cái, chữ số, dấu chấm và dấu gạch dưới.',
      422,
      'INVALID_USERNAME',
    );
  }
}

function validatePassword(password) {
  const byteLength = Buffer.byteLength(password, 'utf8');

  if (password.length < 6) {
    throw new AppError('Mật khẩu phải có ít nhất 6 ký tự.', 422, 'INVALID_PASSWORD');
  }

  if (byteLength > 72) {
    throw new AppError('Mật khẩu quá dài. Vui lòng dùng tối đa 72 byte.', 422, 'INVALID_PASSWORD');
  }
}

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return hash.replace(/^\$2b\$/, '$2a$');
}

async function verifyPassword(password, storedPassword) {
  if (storedPassword.startsWith('$2a$')
    || storedPassword.startsWith('$2b$')
    || storedPassword.startsWith('$2y$')) {
    return bcrypt.compare(password, storedPassword);
  }

  return password === storedPassword;
}

async function authenticate({ username: rawUsername, password: rawPassword }) {
  const username = normalizeUsername(rawUsername);
  const password = String(rawPassword || '');

  if (!username || !password) {
    throw new AppError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.', 422, 'MISSING_CREDENTIALS');
  }

  const account = await authRepository.findAccountByUsername(username);

  if (!account) {
    throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng.', 401, 'INVALID_CREDENTIALS');
  }

  if (account.trang_thai === 'Bi khoa') {
    throw new AppError('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.', 403, 'ACCOUNT_LOCKED');
  }

  const isValid = await verifyPassword(password, account.mat_khau);
  if (!isValid) {
    throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng.', 401, 'INVALID_CREDENTIALS');
  }

  const isLegacyPlainText = !account.mat_khau.startsWith('$2');
  if (isLegacyPlainText) {
    const upgradedHash = await hashPassword(password);
    await authRepository.updatePasswordHash(account.ma_tai_khoan, upgradedHash);
  }

  return toSessionUser(account);
}

async function registerCustomer(payload) {
  const username = normalizeUsername(payload.username);
  const password = String(payload.password || '');
  const confirmPassword = String(payload.confirmPassword || '');
  const fullName = normalizeText(payload.fullName);
  const phone = normalizeText(payload.phone);

  validateUsername(username);
  validatePassword(password);

  if (password !== confirmPassword) {
    throw new AppError('Mật khẩu xác nhận không khớp.', 422, 'PASSWORD_MISMATCH');
  }

  if (fullName.length < 2 || fullName.length > 100) {
    throw new AppError('Họ và tên phải có từ 2 đến 100 ký tự.', 422, 'INVALID_FULL_NAME');
  }

  if (!PHONE_PATTERN.test(phone)) {
    throw new AppError('Số điện thoại phải bắt đầu bằng 0 và có 10 hoặc 11 chữ số.', 422, 'INVALID_PHONE');
  }

  if (await authRepository.usernameExists(username)) {
    throw new AppError('Tên đăng nhập đã được sử dụng.', 409, 'USERNAME_EXISTS');
  }

  const passwordHash = await hashPassword(password);

  try {
    const account = await authRepository.registerCustomer({
      username,
      passwordHash,
      fullName,
      phone,
    });

    return toSessionUser(account);
  } catch (error) {
    if (error.code === '23505' || error.code === 'REGISTER_FUNCTION_FAILED') {
      throw new AppError('Tên đăng nhập đã được sử dụng.', 409, 'USERNAME_EXISTS');
    }

    throw error;
  }
}

async function getCurrentUser(accountId) {
  const account = await authRepository.findAccountById(accountId);
  return account ? toSessionUser(account) : null;
}

async function getStatus() {
  return authRepository.healthCheck();
}

module.exports = {
  authenticate,
  getCurrentUser,
  getStatus,
  registerCustomer,
  _private: {
    hashPassword,
    normalizeText,
    normalizeUsername,
    toSessionUser,
    validatePassword,
    validateUsername,
    verifyPassword,
  },
};
