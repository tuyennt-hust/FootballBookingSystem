const test = require('node:test');
const assert = require('node:assert/strict');
const pitchService = require('../../src/services/pitchService');

const { mapAvailability, normalizeBookingDate } = pitchService._private;

test('booking date accepts today inside the configured 30-day window', () => {
  const now = new Date(2026, 7, 7, 10, 0, 0);
  const result = normalizeBookingDate('2026-08-07', now);
  assert.equal(result.bookingDate, '2026-08-07');
  assert.equal(result.maxDate, '2026-09-06');
});

test('booking date rejects impossible and out-of-window dates', () => {
  const now = new Date(2026, 7, 7, 10, 0, 0);
  assert.throws(() => normalizeBookingDate('2026-02-30', now), /Ngày xem lịch không hợp lệ/);
  assert.throws(() => normalizeBookingDate('2026-10-01', now), /Chỉ có thể xem và đặt lịch/);
});

test('availability marks an already-started same-day slot as past', () => {
  const slot = mapAvailability({
    ma_khung_gio: 'KG01', gio_bat_dau: '06:00', gio_ket_thuc: '08:00',
    la_gio_diem: false, gia_ca: '200000', con_trong: true,
  }, '2026-08-07', new Date(2026, 7, 7, 7, 0, 0));
  assert.equal(slot.available, false);
  assert.equal(slot.state, 'past');
});

test('availability preserves peak price and booked state from PostgreSQL', () => {
  const slot = mapAvailability({
    ma_khung_gio: 'KG06', gio_bat_dau: '18:00', gio_ket_thuc: '20:00',
    la_gio_diem: true, gia_ca: '240000', con_trong: false,
  }, '2026-08-08', new Date(2026, 7, 7, 10, 0, 0));
  assert.equal(slot.available, false);
  assert.equal(slot.state, 'booked');
  assert.equal(slot.gia_ca, 240000);
  assert.equal(slot.la_gio_diem, true);
});
