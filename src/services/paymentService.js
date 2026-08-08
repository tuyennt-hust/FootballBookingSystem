const paymentRepository = require('../repositories/paymentRepository');
const AppError = require('../utils/AppError');
const { formatDateLabel } = require('../utils/dateTime');
const { bookingStatusMeta, paymentStatusMeta, toDateInput } = require('../utils/booking');
const { getPitchImage } = require('../utils/pitch');
const {
  normalizeQuantity,
  normalizeServiceId,
  paymentActionState,
  requireCustomer,
  serviceIcon,
  validateBookingId,
} = require('../utils/payment');

function mapInvoice(record) {
  if (!record) return null;
  const bookingDate = toDateInput(record.ngay_dat);
  return {
    ...record,
    ngay_dat: bookingDate,
    ngay_dat_label: formatDateLabel(bookingDate),
    tong_tien_san: Number(record.tong_tien_san || 0),
    tong_tien_dich_vu: Number(record.tong_tien_dich_vu || 0),
    tong_tien: Number(record.tong_tien || 0),
    timeLabel: `${record.gio_bat_dau} - ${record.gio_ket_thuc}`,
    imageUrl: getPitchImage(record.loai_san, record.image_url),
    bookingStatus: bookingStatusMeta(record.trang_thai_dat),
    paymentStatus: paymentStatusMeta(record.trang_thai_thanh_toan),
  };
}

function mapService(record) {
  return {
    ...record,
    don_gia: Number(record.don_gia || 0),
    so_luong: Number(record.so_luong || 0),
    thanh_tien: Number(record.thanh_tien || 0),
    icon: serviceIcon(record.ten_dv),
  };
}

function repositoryError(error) {
  const message = error.functionMessage || error.message || 'Không thể xử lý hóa đơn.';
  const statusByCode = {
    INVOICE_NOT_FOUND: 404,
    BOOKING_SERVICE_NOT_FOUND: 404,
    BOOKING_CANCELLED: 409,
    BOOKING_NOT_CONFIRMED: 409,
    INVOICE_ALREADY_PAID: 409,
    ADD_SERVICE_FUNCTION_FAILED: 400,
    PAYMENT_FUNCTION_FAILED: 400,
  };
  return new AppError(message, statusByCode[error.code] || 400, error.code || 'PAYMENT_ERROR');
}

async function getInvoiceData(rawBookingId, currentUser) {
  const user = requireCustomer(currentUser);
  const bookingId = validateBookingId(rawBookingId);
  const [bundle, catalog] = await Promise.all([
    paymentRepository.getInvoiceBundle(bookingId, user.customerId),
    paymentRepository.findServiceCatalog(),
  ]);

  if (!bundle.invoice) {
    throw new AppError('Không tìm thấy hóa đơn thuộc tài khoản này.', 404, 'INVOICE_NOT_FOUND');
  }

  const invoice = mapInvoice(bundle.invoice);
  return {
    invoice,
    actionState: paymentActionState(invoice),
    selectedServices: bundle.services.map(mapService),
    serviceCatalog: catalog.map(mapService),
  };
}

module.exports = {
  async getStatus() {
    return paymentRepository.healthCheck();
  },

  getInvoiceData,

  async addService(rawBookingId, payload, currentUser) {
    const user = requireCustomer(currentUser);
    const bookingId = validateBookingId(rawBookingId);
    const serviceId = normalizeServiceId(payload.serviceId);
    if (!serviceId) throw new AppError('Mã dịch vụ không hợp lệ.', 422, 'INVALID_SERVICE_ID');
    const quantity = normalizeQuantity(payload.quantity);

    try {
      return await paymentRepository.addService({
        bookingId,
        customerId: user.customerId,
        serviceId,
        quantity,
      });
    } catch (error) {
      throw repositoryError(error);
    }
  },

  async removeService(rawBookingId, rawServiceId, currentUser) {
    const user = requireCustomer(currentUser);
    const bookingId = validateBookingId(rawBookingId);
    const serviceId = normalizeServiceId(rawServiceId);
    if (!serviceId) throw new AppError('Mã dịch vụ không hợp lệ.', 422, 'INVALID_SERVICE_ID');

    try {
      return await paymentRepository.removeService({
        bookingId,
        customerId: user.customerId,
        serviceId,
      });
    } catch (error) {
      throw repositoryError(error);
    }
  },

  async pay(rawBookingId, currentUser) {
    const user = requireCustomer(currentUser);
    const bookingId = validateBookingId(rawBookingId);

    try {
      return await paymentRepository.payInvoice({ bookingId, customerId: user.customerId });
    } catch (error) {
      throw repositoryError(error);
    }
  },

  _private: { mapInvoice, mapService },
};
