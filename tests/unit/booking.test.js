const test = require('node:test');
const assert = require('node:assert/strict');
const {
  bookingStatusMeta,
  getCancellationState,
  normalizeBookingId,
  normalizeStatusFilter,
  paymentStatusMeta,
} = require('../../src/utils/booking');

test('normalizeBookingId accepts project booking ids', () => {
  assert.equal(normalizeBookingId(' ds121 '), 'DS121');
  assert.equal(normalizeBookingId('DS_BIG_00001'), 'DS_BIG_00001');
});

test('normalizeBookingId rejects unsafe ids', () => {
  assert.equal(normalizeBookingId('../DS001'), '');
  assert.equal(normalizeBookingId(''), '');
});

test('normalizeStatusFilter falls back to all', () => {
  assert.equal(normalizeStatusFilter('confirmed'), 'confirmed');
  assert.equal(normalizeStatusFilter('unknown'), 'all');
});

test('status metadata maps database values to Vietnamese labels', () => {
  assert.equal(bookingStatusMeta('Cho xac nhan').label, 'Chờ xác nhận');
  assert.equal(paymentStatusMeta('Da thanh toan').label, 'Đã thanh toán');
});

test('future unpaid booking can be cancelled', () => {
  const state = getCancellationState({
    ngay_dat: '2026-08-10',
    gio_bat_dau: '18:00',
    trang_thai_dat: 'Cho xac nhan',
    trang_thai_thanh_toan: 'Chua thanh toan',
  }, new Date(2026, 7, 6, 19, 0));

  assert.equal(state.allowed, true);
});

test('paid, cancelled or started booking cannot be cancelled', () => {
  const base = {
    ngay_dat: '2026-08-06',
    gio_bat_dau: '18:00',
    trang_thai_dat: 'Cho xac nhan',
    trang_thai_thanh_toan: 'Chua thanh toan',
  };

  assert.equal(getCancellationState({ ...base, trang_thai_thanh_toan: 'Da thanh toan' }).allowed, false);
  assert.equal(getCancellationState({ ...base, trang_thai_dat: 'Da huy' }).allowed, false);
  assert.equal(getCancellationState(base, new Date(2026, 7, 6, 19, 0)).allowed, false);
});
