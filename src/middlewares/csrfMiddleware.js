const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const DEFERRED_MULTIPART_PATHS = [
  /^\/chu-san\/san-bong$/,
  /^\/chu-san\/san-bong\/[^/]+\/chinh-sua$/,
];

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function tokensMatch(expected, received) {
  if (typeof expected !== 'string' || typeof received !== 'string') return false;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function rejectInvalidCsrf(next) {
  const error = new Error('Yêu cầu không hợp lệ hoặc phiên biểu mẫu đã hết hạn. Vui lòng tải lại trang.');
  error.status = 403;
  error.code = 'INVALID_CSRF_TOKEN';
  return next(error);
}

function csrfProtection(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = createToken();
  }

  res.locals.csrfToken = req.session.csrfToken;

  if (SAFE_METHODS.has(req.method)) return next();

  // Chỉ hai route upload ảnh sân được phép hoãn kiểm tra đến sau Multer.
  // Mọi POST multipart khác vẫn phải có token ở header và không được tự động bỏ qua CSRF.
  const canDeferMultipart = req.is('multipart/form-data')
    && DEFERRED_MULTIPART_PATHS.some((pattern) => pattern.test(req.path));
  if (canDeferMultipart) return next();

  const receivedToken = req.body?._csrf || req.get('x-csrf-token');
  if (!tokensMatch(req.session.csrfToken, receivedToken)) {
    return rejectInvalidCsrf(next);
  }

  return next();
}

function multipartCsrfProtection(req, res, next) {
  const receivedToken = req.body?._csrf || req.get('x-csrf-token');
  if (!tokensMatch(req.session?.csrfToken, receivedToken)) {
    return rejectInvalidCsrf(next);
  }

  return next();
}

module.exports = csrfProtection;
module.exports.multipartCsrfProtection = multipartCsrfProtection;
module.exports._private = { createToken, tokensMatch };
