const ownerRepository = require('../repositories/ownerRepository');
const AppError = require('../utils/AppError');
const { formatDateLabel } = require('../utils/dateTime');
const {
  bookingStatusMeta,
  getStatusFilterValue,
  normalizeBookingId,
  normalizeStatusFilter,
  paymentStatusMeta,
  toDateInput,
} = require('../utils/booking');
const {
  getPitchImage,
  pitchStatusMeta,
  PITCH_STATUSES,
  PITCH_TYPES,
} = require('../utils/pitch');

const {
  normalizePage,
  normalizePitchId,
  normalizeText,
  requireOwner,
  validatePitchInput,
} = require('../utils/owner');

const PAGE_SIZE = 10;

function mapPitch(record) {
  return {
    ...record,
    gia_thue: Number(record.gia_thue || 0),
    so_don_sap_toi: Number(record.so_don_sap_toi || 0),
    so_don_cho_xac_nhan: Number(record.so_don_cho_xac_nhan || 0),
    imageUrl: getPitchImage(record.loai_san, record.image_url),
    statusMeta: pitchStatusMeta(record.trang_thai),
  };
}

function mapBooking(record) {
  const bookingDate = toDateInput(record.ngay_dat);
  const startsAt = record.bat_dau_luc ? new Date(record.bat_dau_luc) : null;
  const canConfirm = record.trang_thai_dat === 'Cho xac nhan'
    && startsAt instanceof Date
    && !Number.isNaN(startsAt.getTime())
    && startsAt.getTime() > Date.now();

  return {
    ...record,
    ngay_dat: bookingDate,
    ngay_dat_label: formatDateLabel(bookingDate),
    tien_san: Number(record.tien_san || 0),
    tong_tien_san: Number(record.tong_tien_san || 0),
    tong_tien_dich_vu: Number(record.tong_tien_dich_vu || 0),
    tong_tien: Number(record.tong_tien || 0),
    timeLabel: `${record.gio_bat_dau} - ${record.gio_ket_thuc}`,
    imageUrl: getPitchImage(record.loai_san, record.image_url),
    bookingStatus: bookingStatusMeta(record.trang_thai_dat),
    paymentStatus: paymentStatusMeta(record.trang_thai_thanh_toan),
    canConfirm,
    confirmReason: canConfirm
      ? 'Đơn hợp lệ và chưa đến giờ bắt đầu.'
      : record.trang_thai_dat !== 'Cho xac nhan'
        ? 'Đơn không còn ở trạng thái chờ xác nhận.'
        : 'Đã đến hoặc qua giờ bắt đầu.',
  };
}

function mapRepositoryError(error) {
  if (['OWNER_PITCH_NOT_FOUND', 'OWNER_BOOKING_NOT_FOUND'].includes(error.code)) {
    return new AppError(error.message, 404, error.code);
  }
  if (error.code === 'PITCH_HAS_FUTURE_BOOKINGS') {
    return new AppError(error.message, 409, error.code);
  }
  if (['BOOKING_NOT_PENDING', 'BOOKING_ALREADY_STARTED'].includes(error.code)) {
    return new AppError(error.message, 409, error.code);
  }
  if (error.code === '23503') {
    return new AppError('Khu vực được chọn không tồn tại.', 422, 'AREA_NOT_FOUND');
  }
  if (error.code === 'CREATE_PITCH_FUNCTION_FAILED') {
    return new AppError(error.functionMessage || error.message, 400, error.code);
  }
  return error;
}

module.exports = {
  async getStatus() {
    return ownerRepository.healthCheck();
  },

  async getDashboard(currentUser) {
    const owner = requireOwner(currentUser);
    const data = await ownerRepository.getDashboard(owner.ownerId);

    const statusCounts = Object.fromEntries(PITCH_STATUSES.map((status) => [status, 0]));
    data.pitchStatus.forEach((row) => {
      statusCounts[row.trang_thai] = Number(row.so_luong || 0);
    });

    return {
      owner,
      stats: {
        totalPitches: Number(data.stats.tong_so_san || 0),
        activePitches: Number(data.stats.san_hoat_dong || 0),
        pendingBookings: Number(data.stats.don_cho_xac_nhan || 0),
        todayBookings: Number(data.stats.don_hom_nay || 0),
        paidRevenue: Number(data.stats.doanh_thu_da_thanh_toan || 0),
      },
      statusCounts,
      recentBookings: data.recentBookings.map(mapBooking),
    };
  },

  async getPitchList(currentUser) {
    const owner = requireOwner(currentUser);
    const records = await ownerRepository.findOwnerPitches(owner.ownerId);
    return { owner, pitches: records.map(mapPitch) };
  },

  async getPitchForm(rawPitchId, currentUser) {
    const owner = requireOwner(currentUser);
    const [areas, pitch] = await Promise.all([
      ownerRepository.findAreas(),
      rawPitchId
        ? ownerRepository.findOwnerPitchById(normalizePitchId(rawPitchId), owner.ownerId)
        : Promise.resolve(null),
    ]);

    if (rawPitchId && !pitch) {
      throw new AppError('Không tìm thấy sân thuộc tài khoản chủ sân này.', 404, 'OWNER_PITCH_NOT_FOUND');
    }

    return {
      owner,
      areas,
      pitch: pitch ? mapPitch(pitch) : null,
      pitchTypes: PITCH_TYPES,
    };
  },

  async createPitch(payload, currentUser, imageUrl = null) {
    const owner = requireOwner(currentUser);
    const input = validatePitchInput(payload);

    try {
      const record = await ownerRepository.createPitch({
        ownerId: owner.ownerId,
        ...input,
        imageUrl,
      });
      return mapPitch(record);
    } catch (error) {
      throw mapRepositoryError(error);
    }
  },

  async updatePitch(rawPitchId, payload, currentUser, imageUrl = null) {
    const owner = requireOwner(currentUser);
    const pitchId = normalizePitchId(rawPitchId);
    const input = validatePitchInput(payload);

    try {
      const result = await ownerRepository.updatePitch({
        pitchId,
        ownerId: owner.ownerId,
        ...input,
        imageUrl,
      });
      return {
        pitch: mapPitch(result.pitch),
        previousImageUrl: result.previousImageUrl,
      };
    } catch (error) {
      throw mapRepositoryError(error);
    }
  },

  async updatePitchStatus(rawPitchId, rawStatus, currentUser) {
    const owner = requireOwner(currentUser);
    const pitchId = normalizePitchId(rawPitchId);
    const status = normalizeText(rawStatus, 30);

    if (!PITCH_STATUSES.includes(status)) {
      throw new AppError('Trạng thái sân không hợp lệ.', 422, 'INVALID_PITCH_STATUS');
    }

    try {
      return mapPitch(await ownerRepository.updatePitchStatus({
        pitchId,
        ownerId: owner.ownerId,
        status,
      }));
    } catch (error) {
      throw mapRepositoryError(error);
    }
  },

  async getBookingList(query, currentUser) {
    const owner = requireOwner(currentUser);
    const statusKey = normalizeStatusFilter(query.status);
    const status = getStatusFilterValue(statusKey);
    const pitchId = query.pitch ? normalizePitchId(query.pitch) : '';
    const page = normalizePage(query.page);
    const offset = (page - 1) * PAGE_SIZE;

    const [result, pitchRecords] = await Promise.all([
      ownerRepository.findOwnerBookings({
        ownerId: owner.ownerId,
        status,
        pitchId,
        limit: PAGE_SIZE,
        offset,
      }),
      ownerRepository.findOwnerPitches(owner.ownerId),
    ]);

    const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
    if (page > totalPages && result.total > 0) {
      return this.getBookingList({ ...query, page: totalPages }, currentUser);
    }

    return {
      owner,
      bookings: result.rows.map(mapBooking),
      pitches: pitchRecords.map(mapPitch),
      filters: { status: statusKey, pitch: pitchId },
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

  async getBookingDetail(rawBookingId, currentUser) {
    const owner = requireOwner(currentUser);
    const bookingId = normalizeBookingId(rawBookingId);
    if (!bookingId) {
      throw new AppError('Mã đặt sân không hợp lệ.', 400, 'INVALID_BOOKING_ID');
    }

    const record = await ownerRepository.findOwnerBookingById(bookingId, owner.ownerId);
    if (!record) {
      throw new AppError('Không tìm thấy đơn đặt sân thuộc hệ thống sân của bạn.', 404, 'OWNER_BOOKING_NOT_FOUND');
    }
    return mapBooking(record);
  },

  async confirmBooking(rawBookingId, currentUser) {
    const owner = requireOwner(currentUser);
    const bookingId = normalizeBookingId(rawBookingId);
    if (!bookingId) {
      throw new AppError('Mã đặt sân không hợp lệ.', 400, 'INVALID_BOOKING_ID');
    }

    try {
      return mapBooking(await ownerRepository.confirmBooking({
        bookingId,
        ownerId: owner.ownerId,
      }));
    } catch (error) {
      throw mapRepositoryError(error);
    }
  },

  _private: {
    mapBooking,
    mapPitch,
    requireOwner,
    validatePitchInput,
  },
};
