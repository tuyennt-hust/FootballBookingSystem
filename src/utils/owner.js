const AppError = require('./AppError');
const { PITCH_TYPES } = require('./pitch');

const MAX_PRICE = 10_000_000;

function requireOwner(currentUser) {
  if (!currentUser || currentUser.role !== 'Chu san' || !currentUser.ownerId) {
    throw new AppError('Chỉ tài khoản chủ sân mới có thể sử dụng chức năng này.', 403, 'OWNER_REQUIRED');
  }
  return currentUser;
}

function normalizeText(value, maxLength) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizePitchId(value) {
  const pitchId = normalizeText(value, 20).toUpperCase();
  if (!/^S[A-Z0-9_-]{1,19}$/.test(pitchId)) {
    throw new AppError('Mã sân không hợp lệ.', 400, 'INVALID_PITCH_ID');
  }
  return pitchId;
}

function normalizePage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function validatePitchInput(payload) {
  const data = {
    name: normalizeText(payload.name, 100),
    address: normalizeText(payload.address, 200),
    pitchType: normalizeText(payload.pitchType, 20),
    areaId: normalizeText(payload.areaId, 20).toUpperCase(),
    price: Number(payload.price),
  };

  if (data.name.length < 3) {
    throw new AppError('Tên sân phải có ít nhất 3 ký tự.', 422, 'INVALID_PITCH_NAME');
  }
  if (data.address.length < 5) {
    throw new AppError('Địa chỉ sân phải có ít nhất 5 ký tự.', 422, 'INVALID_PITCH_ADDRESS');
  }
  if (!PITCH_TYPES.includes(data.pitchType)) {
    throw new AppError('Loại sân không hợp lệ.', 422, 'INVALID_PITCH_TYPE');
  }
  if (!/^KV[A-Z0-9_-]{1,18}$/.test(data.areaId)) {
    throw new AppError('Khu vực không hợp lệ.', 422, 'INVALID_AREA');
  }
  if (!Number.isFinite(data.price) || data.price <= 0 || data.price > MAX_PRICE) {
    throw new AppError('Giá thuê phải lớn hơn 0 và không vượt quá 10.000.000 đồng.', 422, 'INVALID_PRICE');
  }

  data.price = Math.round(data.price);
  return data;
}

module.exports = {
  normalizePage,
  normalizePitchId,
  normalizeText,
  requireOwner,
  validatePitchInput,
};
