const test = require('node:test');
const assert = require('node:assert/strict');
const authService = require('../../src/services/authService');

const {
  hashPassword,
  normalizeText,
  normalizeUsername,
  toSessionUser,
  validatePassword,
  validateUsername,
  verifyPassword,
} = authService._private;

test('auth normalizes username and display text', () => {
  assert.equal(normalizeUsername('  Khach.Demo_1 '), 'khach.demo_1');
  assert.equal(normalizeText('  Nguyễn   Văn   Demo  '), 'Nguyễn Văn Demo');
});

test('username validation rejects unsafe or too short values', () => {
  assert.throws(() => validateUsername('abc'), /4 đến 50/);
  assert.throws(() => validateUsername('demo user'), /chữ cái/);
  assert.doesNotThrow(() => validateUsername('khach.demo_1'));
});

test('password validation enforces minimum length and bcrypt byte limit', () => {
  assert.throws(() => validatePassword('12345'), /ít nhất 6/);
  assert.throws(() => validatePassword('á'.repeat(37)), /72 byte/);
  assert.doesNotThrow(() => validatePassword('123456'));
});

test('bcrypt hashing and comparison work without storing plaintext', async () => {
  const hash = await hashPassword('123456');
  assert.match(hash, /^\$2a\$/);
  assert.equal(await verifyPassword('123456', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
});

test('legacy plaintext comparison remains supported for seeded demo accounts', async () => {
  assert.equal(await verifyPassword('123456', '123456'), true);
  assert.equal(await verifyPassword('654321', '123456'), false);
});

test('session user never exposes password fields', () => {
  const sessionUser = toSessionUser({
    ma_tai_khoan: 'TK_KH01', ten_dang_nhap: 'khach01', vai_tro: 'Khach hang',
    ho_va_ten: 'Khách Demo', sdt: '0980000001', ma_khach_hang: 'KH01', ma_chu_san: null,
    mat_khau: 'secret',
  });
  assert.equal(sessionUser.accountId, 'TK_KH01');
  assert.equal(sessionUser.customerId, 'KH01');
  assert.equal(Object.prototype.hasOwnProperty.call(sessionUser, 'mat_khau'), false);
});
