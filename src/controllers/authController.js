const authService = require('../services/authService');
const {
  destroySession,
  regenerateSession,
  safeRedirectPath,
  saveSession,
  setFlash,
} = require('../utils/session');

function loginViewData(req, overrides = {}) {
  return {
    title: 'Đăng nhập',
    pageDescription: 'Đăng nhập vào hệ thống đặt sân bóng.',
    formData: {
      username: '',
      next: safeRedirectPath(req.query.next || req.body?.next, ''),
      ...overrides.formData,
    },
    formError: overrides.formError || null,
    formNotice: overrides.formNotice || (req.query.loggedOut ? 'Bạn đã đăng xuất khỏi hệ thống.' : null),
  };
}

function registerViewData(overrides = {}) {
  return {
    title: 'Đăng ký',
    pageDescription: 'Tạo tài khoản khách hàng để đặt sân trực tuyến.',
    formData: {
      fullName: '',
      phone: '',
      username: '',
      ...overrides.formData,
    },
    formError: overrides.formError || null,
  };
}

module.exports = {
  showLogin(req, res) {
    return res.render('auth/login', loginViewData(req));
  },

  async login(req, res, next) {
    const formData = {
      username: String(req.body.username || '').trim(),
      next: safeRedirectPath(req.body.next, ''),
    };

    try {
      const user = await authService.authenticate(req.body);
      await regenerateSession(req);

      req.session.user = user;
      setFlash(req, 'success', `Đăng nhập thành công. Xin chào ${user.fullName}!`);
      await saveSession(req);

      const destination = safeRedirectPath(formData.next, '/tai-khoan');
      return res.redirect(destination);
    } catch (error) {
      if (error.status && error.status < 500) {
        return res.status(error.status).render('auth/login', loginViewData(req, {
          formData,
          formError: error.message,
        }));
      }

      return next(error);
    }
  },

  showRegister(req, res) {
    return res.render('auth/register', registerViewData());
  },

  async register(req, res, next) {
    const formData = {
      fullName: String(req.body.fullName || '').trim(),
      phone: String(req.body.phone || '').trim(),
      username: String(req.body.username || '').trim(),
    };

    try {
      await authService.registerCustomer(req.body);
      setFlash(req, 'success', 'Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.');
      await saveSession(req);
      return res.redirect('/dang-nhap');
    } catch (error) {
      if (error.status && error.status < 500) {
        return res.status(error.status).render('auth/register', registerViewData({
          formData,
          formError: error.message,
        }));
      }

      return next(error);
    }
  },

  async profile(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.session.user.accountId);

      if (!user) {
        await destroySession(req);
        res.clearCookie(req.app.get('sessionCookieName'));
        return res.redirect('/dang-nhap');
      }

      req.session.user = user;

      return res.render('auth/profile', {
        title: 'Tài khoản của tôi',
        pageDescription: 'Thông tin tài khoản đang đăng nhập.',
        user,
      });
    } catch (error) {
      return next(error);
    }
  },

  async logout(req, res, next) {
    try {
      await destroySession(req);
      res.clearCookie(req.app.get('sessionCookieName') || 'football.sid');
      return res.redirect('/dang-nhap?loggedOut=1');
    } catch (error) {
      return next(error);
    }
  },

  async status(req, res, next) {
    try {
      const data = await authService.getStatus();
      return res.json({ success: true, module: 'auth', data });
    } catch (error) {
      return next(error);
    }
  },

  me(req, res) {
    return res.json({ success: true, data: req.session.user });
  },

  csrf(req, res) {
    return res.json({ success: true, data: { csrfToken: req.session.csrfToken } });
  },
};
