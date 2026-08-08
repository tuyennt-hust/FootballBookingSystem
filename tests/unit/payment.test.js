const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeQuantity,
  normalizeServiceId,
  paymentActionState,
  serviceIcon,
} = require('../../src/utils/payment');

test('normalizeServiceId accepts project service ids and rejects unsafe values', () => {
  assert.equal(normalizeServiceId(' dv01 '), 'DV01');
  assert.equal(normalizeServiceId('../DV01'), '');
});

test('normalizeQuantity accepts 1..20 and rejects invalid quantity', () => {
  assert.equal(normalizeQuantity('3'), 3);
  assert.throws(() => normalizeQuantity('0'), /Số lượng dịch vụ/);
  assert.throws(() => normalizeQuantity('21'), /Số lượng dịch vụ/);
});

test('paymentActionState only enables confirmed unpaid invoices', () => {
  assert.equal(paymentActionState({
    trang_thai_dat: 'Da xac nhan',
    trang_thai_thanh_toan: 'Chua thanh toan',
    tong_tien: 200000,
  }).canPay, true);

  assert.equal(paymentActionState({
    trang_thai_dat: 'Cho xac nhan',
    trang_thai_thanh_toan: 'Chua thanh toan',
    tong_tien: 200000,
  }).canPay, false);

  assert.equal(paymentActionState({
    trang_thai_dat: 'Da xac nhan',
    trang_thai_thanh_toan: 'Da thanh toan',
    tong_tien: 200000,
  }).canEditServices, false);
});

test('serviceIcon provides useful catalog icons without image assets', () => {
  assert.equal(serviceIcon('Bong thue'), '⚽');
  assert.equal(serviceIcon('Nuoc suoi'), '🥤');
});
