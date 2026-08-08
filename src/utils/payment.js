const AppError = require('./AppError');
const { normalizeBookingId } = require('./booking');

const MAX_SERVICE_QUANTITY = 20;

function requireCustomer(currentUser) {
  if (!currentUser || currentUser.role !== 'Khach hang' || !currentUser.customerId) {
    throw new AppError('Chỉ tài khoản khách hàng mới có thể sử dụng chức năng thanh toán.', 403, 'CUSTOMER_REQUIRED');
  }
  return currentUser;
}

function normalizeServiceId(value) {
  const serviceId = String(value || '').trim().toUpperCase();
  if (!/^DV[A-Z0-9_-]{1,17}$/.test(serviceId)) return '';
  return serviceId;
}

function normalizeQuantity(value) {
  const quantity = Number.parseInt(value, 10);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_SERVICE_QUANTITY) {
    throw new AppError(
      `Số lượng dịch vụ phải từ 1 đến ${MAX_SERVICE_QUANTITY}.`,
      422,
      'INVALID_SERVICE_QUANTITY',
    );
  }
  return quantity;
}

function serviceIcon(serviceName = '') {
  const name = String(serviceName).toLowerCase();
  if (name.includes('nuoc') || name.includes('nước') || name.includes('tra ') || name.includes('trà ')) return '🥤';
  if (name.includes('bong') || name.includes('bóng')) return '⚽';
  if (name.includes('ao ') || name.includes('áo ')) return '👕';
  if (name.includes('khan') || name.includes('khăn')) return '🧻';
  if (name.includes('gui xe') || name.includes('gửi xe')) return '🅿️';
  if (name.includes('y te') || name.includes('y tế')) return '🩹';
  if (name.includes('trong tai') || name.includes('trọng tài')) return '🟨';
  if (name.includes('quay') || name.includes('camera')) return '🎥';
  return '➕';
}

function paymentActionState(invoice) {
  if (!invoice) {
    return { canEditServices: false, canPay: false, reason: 'Không tìm thấy hóa đơn.' };
  }
  if (invoice.trang_thai_dat === 'Da huy') {
    return { canEditServices: false, canPay: false, reason: 'Đơn đã hủy nên hóa đơn không còn hiệu lực.' };
  }
  if (invoice.trang_thai_thanh_toan === 'Da thanh toan') {
    return { canEditServices: false, canPay: false, reason: 'Hóa đơn đã được thanh toán.' };
  }
  if (invoice.trang_thai_dat !== 'Da xac nhan') {
    return {
      canEditServices: false,
      canPay: false,
      reason: 'Chủ sân cần xác nhận đơn trước khi bạn chọn dịch vụ và thanh toán.',
    };
  }
  return {
    canEditServices: true,
    canPay: Number(invoice.tong_tien || 0) > 0,
    reason: 'Đơn đã được xác nhận và có thể thanh toán.',
  };
}

function validateBookingId(value) {
  const bookingId = normalizeBookingId(value);
  if (!bookingId) {
    throw new AppError('Mã đặt sân không hợp lệ.', 400, 'INVALID_BOOKING_ID');
  }
  return bookingId;
}

module.exports = {
  MAX_SERVICE_QUANTITY,
  normalizeQuantity,
  normalizeServiceId,
  paymentActionState,
  requireCustomer,
  serviceIcon,
  validateBookingId,
};
