const pitchRepository = require('../repositories/pitchRepository');
const AppError = require('../utils/AppError');
const {
  addDays,
  formatDateInput,
  formatDateLabel,
  getDateWindow,
  parseDateInput,
  timeToMinutes,
} = require('../utils/dateTime');

const { getPitchImage, PITCH_TYPES } = require('../utils/pitch');
const SORT_OPTIONS = {
  default: 'sb.ma_san ASC',
  price_asc: 'sb.gia_thue ASC, sb.ten_san ASC',
  price_desc: 'sb.gia_thue DESC, sb.ten_san ASC',
  name_asc: 'sb.ten_san ASC',
};
const PAGE_SIZE = 9;
const BOOKING_WINDOW_DAYS = 30;
const LAST_SLOT_START_MINUTES = 20 * 60;

function normalizeText(value, maxLength = 100) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function normalizePage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function normalizePitchId(value) {
  const pitchId = normalizeText(value, 20).toUpperCase();
  if (!/^[A-Z0-9_-]+$/.test(pitchId)) {
    throw new AppError('Mã sân không hợp lệ.', 400, 'INVALID_PITCH_ID');
  }
  return pitchId;
}

function mapPitch(pitch) {
  return {
    ...pitch,
    gia_thue: Number(pitch.gia_thue),
    imageUrl: getPitchImage(pitch.loai_san, pitch.image_url),
  };
}

function getBookingWindow(now = new Date()) {
  return getDateWindow(now, BOOKING_WINDOW_DAYS, LAST_SLOT_START_MINUTES);
}

function normalizeBookingDate(rawDate, now = new Date()) {
  const window = getBookingWindow(now);
  const bookingDate = normalizeText(rawDate, 10) || window.defaultDate;

  if (!parseDateInput(bookingDate)) {
    throw new AppError('Ngày xem lịch không hợp lệ.', 400, 'INVALID_BOOKING_DATE');
  }

  if (bookingDate < window.minDate || bookingDate > window.maxDate) {
    throw new AppError(
      `Chỉ có thể xem và đặt lịch từ ${window.minDate} đến ${window.maxDate}.`,
      400,
      'BOOKING_DATE_OUT_OF_RANGE',
    );
  }

  return { bookingDate, ...window };
}

function mapAvailability(slot, selectedDate, now = new Date()) {
  let available = Boolean(slot.con_trong);
  let state = available ? 'available' : 'booked';
  let statusLabel = available ? 'Còn trống' : 'Đã có người đặt';

  const today = formatDateInput(now);
  const startMinutes = timeToMinutes(slot.gio_bat_dau);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (selectedDate === today && Number.isFinite(startMinutes) && startMinutes <= currentMinutes) {
    available = false;
    state = 'past';
    statusLabel = 'Đã qua giờ';
  }

  return {
    ma_khung_gio: slot.ma_khung_gio,
    gio_bat_dau: slot.gio_bat_dau,
    gio_ket_thuc: slot.gio_ket_thuc,
    timeLabel: `${slot.gio_bat_dau} - ${slot.gio_ket_thuc}`,
    la_gio_diem: Boolean(slot.la_gio_diem),
    gia_ca: Number(slot.gia_ca),
    available,
    state,
    statusLabel,
  };
}

async function getPitchDetailData(rawPitchId, query = {}, now = new Date()) {
  const pitchId = normalizePitchId(rawPitchId);
  const dateRange = normalizeBookingDate(query.date, now);
  const pitchRecord = await pitchRepository.findPublicById(pitchId);

  if (!pitchRecord) {
    throw new AppError('Không tìm thấy sân đang hoạt động.', 404, 'PITCH_NOT_FOUND');
  }

  const [slotRecords, relatedRecords] = await Promise.all([
    pitchRepository.findAvailability(pitchId, dateRange.bookingDate),
    pitchRepository.findRelated(pitchId, pitchRecord.ma_khu_vuc, 3),
  ]);

  const availability = slotRecords.map((slot) => mapAvailability(slot, dateRange.bookingDate, now));

  return {
    pitch: mapPitch(pitchRecord),
    availability,
    relatedPitches: relatedRecords.map(mapPitch),
    selectedDate: dateRange.bookingDate,
    selectedDateLabel: formatDateLabel(dateRange.bookingDate),
    minDate: dateRange.minDate,
    maxDate: dateRange.maxDate,
    availableCount: availability.filter((slot) => slot.available).length,
  };
}

async function getBookingSelection({ pitchId, date, slotId }, now = new Date()) {
  const detail = await getPitchDetailData(pitchId, { date }, now);
  const normalizedSlotId = normalizeText(slotId, 20).toUpperCase();
  const slot = detail.availability.find((item) => item.ma_khung_gio === normalizedSlotId);

  if (!slot) {
    throw new AppError('Khung giờ đã chọn không tồn tại.', 400, 'INVALID_TIME_SLOT');
  }

  if (!slot.available) {
    throw new AppError('Khung giờ này không còn khả dụng. Vui lòng chọn khung giờ khác.', 409, 'TIME_SLOT_UNAVAILABLE');
  }

  return {
    pitch: detail.pitch,
    slot,
    selectedDate: detail.selectedDate,
    selectedDateLabel: detail.selectedDateLabel,
  };
}

module.exports = {
  async getStatus() {
    return pitchRepository.healthCheck();
  },

  async getHomePageData() {
    const [featuredPitches, areas, stats] = await Promise.all([
      pitchRepository.findFeatured(6),
      pitchRepository.findAreas(),
      pitchRepository.getPublicStats(),
    ]);

    return {
      featuredPitches: featuredPitches.map(mapPitch),
      areas,
      stats,
      pitchTypes: PITCH_TYPES,
    };
  },

  async getPublicPitchList(query = {}) {
    const keyword = normalizeText(query.q);
    const areaId = normalizeText(query.area, 20);
    const requestedPitchType = normalizeText(query.type, 30);
    const pitchType = PITCH_TYPES.includes(requestedPitchType) ? requestedPitchType : '';
    const requestedSort = normalizeText(query.sort, 20) || 'default';
    const sort = Object.prototype.hasOwnProperty.call(SORT_OPTIONS, requestedSort) ? requestedSort : 'default';
    const page = normalizePage(query.page);
    const offset = (page - 1) * PAGE_SIZE;

    const [pitchResult, areas] = await Promise.all([
      pitchRepository.findPublicPitches({
        keyword,
        areaId,
        pitchType,
        sortSql: SORT_OPTIONS[sort],
        limit: PAGE_SIZE,
        offset,
      }),
      pitchRepository.findAreas(),
    ]);

    const totalItems = pitchResult.total;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    if (page > totalPages && totalItems > 0) {
      return this.getPublicPitchList({ ...query, page: totalPages });
    }

    return {
      pitches: pitchResult.rows.map(mapPitch),
      areas,
      pitchTypes: PITCH_TYPES,
      filters: { keyword, areaId, pitchType, sort },
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalItems,
        totalPages,
      },
    };
  },

  getPublicPitchDetail: getPitchDetailData,

  async getPublicAvailability(pitchId, query = {}) {
    const detail = await getPitchDetailData(pitchId, query);
    return {
      pitch: detail.pitch,
      selectedDate: detail.selectedDate,
      selectedDateLabel: detail.selectedDateLabel,
      minDate: detail.minDate,
      maxDate: detail.maxDate,
      availableCount: detail.availableCount,
      availability: detail.availability,
    };
  },

  getBookingSelection,

  _private: {
    getBookingWindow,
    mapAvailability,
    normalizeBookingDate,
  },
};
