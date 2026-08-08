const bookingRepository = require('../repositories/bookingRepository');
const pitchService = require('./pitchService');
const AppError = require('../utils/AppError');
const { formatDateLabel } = require('../utils/dateTime');
const { getPitchImage } = require('../utils/pitch');
const {
  bookingStatusMeta,
  getCancellationState,
  getStatusFilterValue,
  normalizeBookingId,
  normalizeStatusFilter,
  paymentStatusMeta,
  toDateInput,
} = require('../utils/booking');

const PAGE_SIZE = 8;

function requireCustomer(currentUser) {
  if (!currentUser || currentUser.role !== 'Khach hang' || !currentUser.customerId) {
    throw new AppError('Chỉ tài khoản khách hàng mới có thể sử dụng chức năng đặt sân.', 403, 'CUSTOMER_REQUIRED');
  }

  return currentUser;
}

function normalizePage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function mapBooking(record, now = new Date()) {
  const bookingDate = toDateInput(record.ngay_dat);
  const cancellation = getCancellationState(record, now);

  return {
    ...record,
    ngay_dat: bookingDate,
    ngay_dat_label: formatDateLabel(bookingDate),
    tien_san: Number(record.tien_san || 0),
    tong_tien_san: Number(record.tong_tien_san || 0),
    tong_tien_dich_vu: Number(record.tong_tien_dich_vu || 0),
    tong_tien: Number(record.tong_tien || 0),
    so_loai_dich_vu: Number(record.so_loai_dich_vu || 0),
    timeLabel: `${record.gio_bat_dau} - ${record.gio_ket_thuc}`,
    imageUrl: getPitchImage(record.loai_san, record.image_url),
    bookingStatus: bookingStatusMeta(record.trang_thai_dat),
    paymentStatus: paymentStatusMeta(record.trang_thai_thanh_toan),
    canCancel: cancellation.allowed,
    cancelReason: cancellation.reason,
  };
}

function mapFunctionError(error) {
  const message = error.functionMessage || error.message || '';

  if (message.includes('San da duoc dat') || message.includes('trung lich')) {
    return new AppError(
      'Khung giờ vừa được người khác đặt. Vui lòng chọn lại khung giờ khác.',
      409,
      'TIME_SLOT_UNAVAILABLE',
    );
  }

  if (message.includes('da thanh toan')) {
    return new AppError('Đơn đã thanh toán nên không thể hủy.', 409, 'BOOKING_ALREADY_PAID');
  }

  if (error.code === 'BOOKING_NOT_FOUND' || message.includes('khong ton tai') || message.includes('Không tìm thấy')) {
    return new AppError(message, 404, 'BOOKING_RESOURCE_NOT_FOUND');
  }

  return new AppError(message || 'Không thể xử lý đơn đặt sân.', 400, 'BOOKING_FUNCTION_FAILED');
}

async function getCustomerBooking(rawBookingId, currentUser) {
  const user = requireCustomer(currentUser);
  const bookingId = normalizeBookingId(rawBookingId);

  if (!bookingId) {
    throw new AppError('Mã đặt sân không hợp lệ.', 400, 'INVALID_BOOKING_ID');
  }

  const record = await bookingRepository.findCustomerBookingById(bookingId, user.customerId);
  if (!record) {
    throw new AppError('Không tìm thấy đơn đặt sân thuộc tài khoản này.', 404, 'BOOKING_NOT_FOUND');
  }

  return mapBooking(record);
}

module.exports = {
  async getStatus() {
    return bookingRepository.healthCheck();
  },

  async prepareBooking(query, currentUser) {
    const user = requireCustomer(currentUser);
    const selection = await pitchService.getBookingSelection({
      pitchId: query.pitchId,
      date: query.date,
      slotId: query.slotId,
    });

    return {
      ...selection,
      customer: {
        customerId: user.customerId,
        fullName: user.fullName,
        username: user.username,
      },
    };
  },

  async createBooking(input, currentUser) {
    const user = requireCustomer(currentUser);

    const selection = await pitchService.getBookingSelection({
      pitchId: input.pitchId,
      date: input.date,
      slotId: input.slotId,
    });

    try {
      const record = await bookingRepository.createBooking({
        customerId: user.customerId,
        pitchId: selection.pitch.ma_san,
        slotId: selection.slot.ma_khung_gio,
        bookingDate: selection.selectedDate,
      });

      return mapBooking(record);
    } catch (error) {
      if (
        error.code === 'BOOKING_FUNCTION_FAILED'
        || error.code === '23505'
        || String(error.message || '').includes('San da duoc dat')
        || String(error.message || '').includes('trung lich')
      ) {
        throw mapFunctionError(error);
      }
      throw error;
    }
  },

  async getBookingHistory(query, currentUser) {
    const user = requireCustomer(currentUser);
    const statusKey = normalizeStatusFilter(query.status);
    const status = getStatusFilterValue(statusKey);
    const page = normalizePage(query.page);
    const offset = (page - 1) * PAGE_SIZE;

    const result = await bookingRepository.findCustomerBookings({
      customerId: user.customerId,
      status,
      limit: PAGE_SIZE,
      offset,
    });

    const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
    if (page > totalPages && result.total > 0) {
      return this.getBookingHistory({ ...query, page: totalPages }, currentUser);
    }

    return {
      bookings: result.rows.map((row) => mapBooking(row)),
      filters: { status: statusKey },
      statusTabs: [
        { key: 'all', label: 'Tất cả' },
        { key: 'pending', label: 'Chờ xác nhận' },
        { key: 'confirmed', label: 'Đã xác nhận' },
        { key: 'cancelled', label: 'Đã hủy' },
      ],
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalItems: result.total,
        totalPages,
      },
    };
  },

  getBookingDetail: getCustomerBooking,

  async cancelBooking(rawBookingId, currentUser) {
    const user = requireCustomer(currentUser);
    const currentBooking = await getCustomerBooking(rawBookingId, currentUser);

    if (!currentBooking.canCancel) {
      throw new AppError(currentBooking.cancelReason, 409, 'BOOKING_CANNOT_CANCEL');
    }

    try {
      const record = await bookingRepository.cancelBooking({
        bookingId: currentBooking.ma_dat_san,
        customerId: user.customerId,
      });
      return mapBooking(record);
    } catch (error) {
      if (['BOOKING_NOT_FOUND', 'CANCEL_FUNCTION_FAILED'].includes(error.code)) {
        throw mapFunctionError(error);
      }
      throw error;
    }
  },

  _private: {
    mapBooking,
    requireCustomer,
  },
};
