const test = require('node:test');
const assert = require('node:assert/strict');
const customerService = require('../../src/services/customerService');

const { requireCustomer } = customerService._private;

test('customer guard accepts a customer session with customerId', () => {
  const user = { role: 'Khach hang', customerId: 'KH01' };
  assert.equal(requireCustomer(user), user);
});

test('customer guard rejects owner and incomplete sessions', () => {
  assert.throws(() => requireCustomer({ role: 'Chu san', ownerId: 'CS01' }), /khách hàng/);
  assert.throws(() => requireCustomer({ role: 'Khach hang' }), /khách hàng/);
});
