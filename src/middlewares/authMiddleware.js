const { safeRedirectPath, setFlash } = require('../utils/session');

function isApiRequest(req) {
  return req.originalUrl.startsWith('/api');
}

function requireAuth(req, res, next) {
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }

  if (isApiRequest(req)) {
    return res.status(401).json({
      success: false,
      message: 'Bạn cần đăng nhập để sử dụng chức năng này.',
    });
  }

  const nextPath = safeRedirectPath(req.originalUrl, '/');
  setFlash(req, 'warning', 'Vui lòng đăng nhập để tiếp tục.');
  return res.redirect(`/dang-nhap?next=${encodeURIComponent(nextPath)}`);
}

function requireGuest(req, res, next) {
  if (!req.session?.user) return next();

  if (isApiRequest(req)) {
    return res.status(409).json({
      success: false,
      message: 'Bạn đã đăng nhập.',
    });
  }

  return res.redirect('/tai-khoan');
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return requireAuth(req, res, next);
    }

    if (allowedRoles.includes(req.session.user.role)) {
      req.user = req.session.user;
      return next();
    }

    if (isApiRequest(req)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sử dụng chức năng này.',
      });
    }

    const error = new Error('Bạn không có quyền truy cập trang này.');
    error.status = 403;
    return next(error);
  };
}

module.exports = { requireAuth, requireGuest, requireRole };
