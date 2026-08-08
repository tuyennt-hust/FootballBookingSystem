const test = require('node:test');
const assert = require('node:assert/strict');
const { requireOwner, validatePitchInput } = require('../../src/utils/owner');
const { getPitchImage, pitchStatusMeta } = require('../../src/utils/pitch');


test('requireOwner accepts a valid owner session', () => {
  const user = { role: 'Chu san', ownerId: 'CS01' };
  assert.equal(requireOwner(user), user);
});

test('requireOwner rejects a customer session', () => {
  assert.throws(
    () => requireOwner({ role: 'Khach hang', customerId: 'KH01' }),
    /Chỉ tài khoản chủ sân/,
  );
});

test('validatePitchInput normalizes a valid payload', () => {
  const result = validatePitchInput({
    name: '  Sân Demo  ',
    address: '  Số 1 Đại Cồ Việt  ',
    pitchType: 'San 7 nguoi',
    areaId: 'kv01',
    price: '350000',
  });

  assert.deepEqual(result, {
    name: 'Sân Demo',
    address: 'Số 1 Đại Cồ Việt',
    pitchType: 'San 7 nguoi',
    areaId: 'KV01',
    price: 350000,
  });
});

test('validatePitchInput rejects invalid price', () => {
  assert.throws(
    () => validatePitchInput({
      name: 'Sân Demo',
      address: 'Địa chỉ hợp lệ',
      pitchType: 'San 5 nguoi',
      areaId: 'KV01',
      price: '-1',
    }),
    /Giá thuê/,
  );
});

test('getPitchImage prefers uploaded image and falls back by type', () => {
  assert.equal(getPitchImage('San 5 nguoi', '/uploads/pitches/a.webp'), '/uploads/pitches/a.webp');
  assert.equal(getPitchImage('San 5 nguoi', null), '/images/pitch-5.svg');
});

test('pitchStatusMeta maps maintenance status', () => {
  assert.equal(pitchStatusMeta('Bao tri').label, 'Bảo trì');
});

test('validatePitchInput accepts round price 200000', () => {
  const result = validatePitchInput({
    name: 'Sân Bách Khoa',
    address: 'Lê Thanh Nghị, Hai Bà Trưng',
    pitchType: 'San 7 nguoi',
    areaId: 'KV01',
    price: '200000',
  });
  assert.equal(result.price, 200000);
});
