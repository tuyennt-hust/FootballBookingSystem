const test = require('node:test');
const assert = require('node:assert/strict');
const { safeRedirectPath } = require('../../src/utils/session');

test('safeRedirectPath accepts an internal path', () => {
  assert.equal(safeRedirectPath('/san-bong?page=2', '/'), '/san-bong?page=2');
});

test('safeRedirectPath rejects an absolute external URL', () => {
  assert.equal(safeRedirectPath('https://example.com', '/'), '/');
});

test('safeRedirectPath rejects protocol-relative and backslash paths', () => {
  assert.equal(safeRedirectPath('//example.com', '/tai-khoan'), '/tai-khoan');
  assert.equal(safeRedirectPath('/\\example.com', '/tai-khoan'), '/tai-khoan');
});
