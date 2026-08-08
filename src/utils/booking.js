const BOOKING_STATUS_META = {
  'Cho xac nhan': {
    key: 'pending',
    label: 'Chờ xác nhận',
    className: 'status-pending',
  },
  'Da xac nhan': {
    key: 'confirmed',
    label: 'Đã xác nhận',
    className: 'status-confirmed',
  },
  'Da huy': {
    key: 'cancelled',
    label: 'Đã hủy',
    className: 'status-cancelled',
  },
};

const PAYMENT_STATUS_META = {
  'Chua thanh toan': {
    key: 'unpaid',
    label: 'Chưa thanh toán',
    className: 'payment-unpaid',
  },
  'Da thanh toan': {
    key: 'paid',
    label: 'Đã thanh toán',
    className: 'payment-paid',
  },
};

const STATUS_FILTERS = {
  all: '',
  pending: 'Cho xac nhan',
  confirmed: 'Da xac nhan',
  cancelled: 'Da huy',
};

function normalizeBookingId(value) {
  const bookingId = String(value || '').trim().toUpperCase();
  if (!/^DS[A-Z0-9_-]{1,17}$/.test(bookingId)) return '';
  return bookingId;
}

function normalizeStatusFilter(value) {
  const key = String(value || 'all').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(STATUS_FILTERS, key) ? key : 'all';
}

function getStatusFilterValue(key) {
  return STATUS_FILTERS[normalizeStatusFilter(key)];
}

function bookingStatusMeta(status) {
  return BOOKING_STATUS_META[status] || {
    key: 'unknown',
    label: status || 'Không xác định',
    className: 'status-unknown',
  };
}

function paymentStatusMeta(status) {
  return PAYMENT_STATUS_META[status] || {
    key: 'unknown',
    label: status || 'Không xác định',
    className: 'payment-unknown',
  };
}

function toDateInput(value) {
  if (typeof value === 'string') return value.slice(0, 10);
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getBookingStart(booking) {
  const date = toDateInput(booking?.ngay_dat);
  const time = String(booking?.gio_bat_dau || '').slice(0, 5);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const result = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (Number.isNaN(result.getTime())) return null;
  return result;
}

function getCancellationState(booking, now = new Date()) {
  if (!booking) {
    return { allowed: false, reason: 'Không tìm thấy đơn đặt sân.' };
  }

  if (booking.trang_thai_dat === 'Da huy') {
    return { allowed: false, reason: 'Đơn đặt sân này đã được hủy.' };
  }

  if (booking.trang_thai_thanh_toan === 'Da thanh toan') {
    return { allowed: false, reason: 'Đơn đã thanh toán nên không thể hủy trực tuyến.' };
  }

  const startAt = getBookingStart(booking);
  if (!startAt) {
    return { allowed: false, reason: 'Không xác định được thời gian bắt đầu của đơn.' };
  }

  if (startAt.getTime() <= now.getTime()) {
    return { allowed: false, reason: 'Đã đến hoặc qua thời gian bắt đầu nên không thể hủy.' };
  }

  return {
    allowed: true,
    reason: 'Có thể hủy trước thời gian bắt đầu nếu đơn chưa thanh toán.',
  };
}

module.exports = {
  bookingStatusMeta,
  getCancellationState,
  getStatusFilterValue,
  normalizeBookingId,
  normalizeStatusFilter,
  paymentStatusMeta,
  toDateInput,
};
