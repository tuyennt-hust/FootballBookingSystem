const AppError = require('./AppError');

const ACCOUNT_ROLES = ['Khach hang', 'Chu san', 'Admin'];
const ACCOUNT_STATUSES = ['Hoat dong', 'Bi khoa'];
const PITCH_STATUSES = ['Hoat dong', 'Bao tri', 'Ngung hoat dong'];
const BOOKING_STATUSES = ['Cho xac nhan', 'Da xac nhan', 'Da huy'];
const PAYMENT_STATUSES = ['Chua thanh toan', 'Da thanh toan'];

function normalizeText(value, maxLength = 120) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizePage(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeChoice(value, choices, fallback = '') {
  const normalized = normalizeText(value, 50);
  return choices.includes(normalized) ? normalized : fallback;
}

function requireAdmin(currentUser) {
  if (!currentUser || currentUser.role !== 'Admin') {
    throw new AppError('Chức năng này chỉ dành cho quản trị viên.', 403, 'ADMIN_REQUIRED');
  }
  return currentUser;
}

function validateAccountStatus(value) {
  const status = normalizeChoice(value, ACCOUNT_STATUSES);
  if (!status) throw new AppError('Trạng thái tài khoản không hợp lệ.', 422, 'INVALID_ACCOUNT_STATUS');
  return status;
}

function validateAreaInput(payload = {}) {
  const name = normalizeText(payload.name, 100);
  const district = normalizeText(payload.district, 100);
  if (name.length < 2) throw new AppError('Tên khu vực phải có ít nhất 2 ký tự.', 422, 'INVALID_AREA_NAME');
  if (district.length < 2) throw new AppError('Quận/huyện phải có ít nhất 2 ký tự.', 422, 'INVALID_DISTRICT');
  return { name, district };
}

function normalizeAreaId(value) {
  const areaId = normalizeText(value, 20).toUpperCase();
  if (!/^KV[0-9A-Z_-]+$/.test(areaId)) {
    throw new AppError('Mã khu vực không hợp lệ.', 400, 'INVALID_AREA_ID');
  }
  return areaId;
}

function roleLabel(role) {
  return ({ Admin: 'Quản trị viên', 'Chu san': 'Chủ sân', 'Khach hang': 'Khách hàng' })[role] || role;
}

function statusMeta(status) {
  return status === 'Hoat dong'
    ? { key: 'active', label: 'Hoạt động', tone: 'success' }
    : { key: 'locked', label: 'Bị khóa', tone: 'danger' };
}

module.exports = {
  ACCOUNT_ROLES,
  ACCOUNT_STATUSES,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  PITCH_STATUSES,
  normalizeAreaId,
  normalizeChoice,
  normalizePage,
  normalizeText,
  requireAdmin,
  roleLabel,
  statusMeta,
  validateAccountStatus,
  validateAreaInput,
};
