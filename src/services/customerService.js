const customerRepository = require('../repositories/customerRepository');
const AppError = require('../utils/AppError');

function requireCustomer(user) {
  if (!user || user.role !== 'Khach hang' || !user.customerId) {
    throw new AppError('Chức năng này chỉ dành cho khách hàng.', 403, 'CUSTOMER_REQUIRED');
  }
  return user;
}

module.exports = {
  async getStatus() {
    return customerRepository.healthCheck();
  },

  async getSummary(user) {
    requireCustomer(user);
    const row = await customerRepository.getSummary(user.customerId);
    return {
      totalBookings: Number(row.tong_don || 0),
      pendingBookings: Number(row.cho_xac_nhan || 0),
      confirmedBookings: Number(row.da_xac_nhan || 0),
      cancelledBookings: Number(row.da_huy || 0),
      paidInvoices: Number(row.hoa_don_da_thanh_toan || 0),
      totalSpent: Number(row.tong_da_chi || 0),
    };
  },

  _private: { requireCustomer },
};
