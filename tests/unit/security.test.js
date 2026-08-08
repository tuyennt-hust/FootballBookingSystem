const test = require('node:test');
const assert = require('node:assert/strict');
const csrf = require('../../src/middlewares/csrfMiddleware');
const securityHeaders = require('../../src/middlewares/securityMiddleware');

const { createToken, tokensMatch } = csrf._private;
const { isSensitivePath } = securityHeaders._private;

test('CSRF token generator returns unpredictable 64-char hex values', () => {
  const first = createToken();
  const second = createToken();
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.match(second, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
});

test('CSRF comparison accepts equal token and rejects different token', () => {
  const token = createToken();
  assert.equal(tokensMatch(token, token), true);
  assert.equal(tokensMatch(token, createToken()), false);
  assert.equal(tokensMatch(token, ''), false);
});

test('security middleware marks authenticated areas as sensitive', () => {
  assert.equal(isSensitivePath('/tai-khoan'), true);
  assert.equal(isSensitivePath('/dat-san/DS001'), true);
  assert.equal(isSensitivePath('/chu-san/san-bong'), true);
  assert.equal(isSensitivePath('/admin/thong-ke'), true);
  assert.equal(isSensitivePath('/api/payments/DS001'), true);
});

test('security middleware keeps public discovery pages cacheable', () => {
  assert.equal(isSensitivePath('/'), false);
  assert.equal(isSensitivePath('/san-bong'), false);
  assert.equal(isSensitivePath('/images/pitch-5.svg'), false);
});

test('security middleware emits CSP and no-store headers for sensitive pages', () => {
  const headers = {};
  let nextCalled = false;
  securityHeaders(
    { path: '/admin' },
    { setHeader(name, value) { headers[name] = value; } },
    () => { nextCalled = true; },
  );
  assert.equal(nextCalled, true);
  assert.match(headers['Content-Security-Policy'], /default-src 'self'/);
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['Cache-Control'], 'no-store');
});

test('public page receives hardening headers without private cache override', () => {
  const headers = {};
  securityHeaders(
    { path: '/san-bong' },
    { setHeader(name, value) { headers[name] = value; } },
    () => {},
  );
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Cache-Control'], undefined);
});
