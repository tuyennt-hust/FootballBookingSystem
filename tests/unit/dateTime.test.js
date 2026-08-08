const test = require('node:test');
const assert = require('node:assert/strict');
const {
  addDays,
  formatDateInput,
  getDateWindow,
  parseDateInput,
  timeToMinutes,
} = require('../../src/utils/dateTime');

test('parseDateInput accepts a real calendar date', () => {
  const date = parseDateInput('2026-08-05');
  assert.ok(date instanceof Date);
  assert.equal(formatDateInput(date), '2026-08-05');
});

test('parseDateInput rejects impossible dates and wrong formats', () => {
  assert.equal(parseDateInput('2026-02-30'), null);
  assert.equal(parseDateInput('05/08/2026'), null);
  assert.equal(parseDateInput(''), null);
});

test('addDays crosses month boundaries correctly', () => {
  const date = parseDateInput('2026-08-31');
  assert.equal(formatDateInput(addDays(date, 1)), '2026-09-01');
});

test('timeToMinutes converts PostgreSQL time text', () => {
  assert.equal(timeToMinutes('18:30'), 1110);
  assert.equal(timeToMinutes('06:00:00'), 360);
  assert.ok(Number.isNaN(timeToMinutes('25:00')));
});


test('booking window defaults to tomorrow after the last slot has started', () => {
  const now = new Date(2026, 7, 5, 21, 0, 0);
  const window = getDateWindow(now, 30, 20 * 60);
  assert.equal(window.minDate, '2026-08-05');
  assert.equal(window.defaultDate, '2026-08-06');
});
