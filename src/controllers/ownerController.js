const multer = require('multer');
const ownerService = require('../services/ownerService');
const {
  removePublicPitchImage,
  removeUploadedFile,
} = require('../middlewares/uploadMiddleware');
const { saveSession, setFlash } = require('../utils/session');

function uploadErrorMessage(error) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return 'Ảnh sân không được vượt quá 5 MB.';
    if (error.code === 'LIMIT_UNEXPECTED_FILE') return 'Chỉ được tải lên một ảnh sân.';
    return 'Không thể xử lý ảnh tải lên. Vui lòng chọn ảnh khác.';
  }
  return error.message;
}

function formDataFromBody(body = {}, pitchId = '') {
  return {
    ma_san: pitchId,
    ten_san: String(body.name || '').trim(),
    dia_chi: String(body.address || '').trim(),
    loai_san: String(body.pitchType || '').trim(),
    gia_thue: String(body.price || '').trim(),
    ma_khu_vuc: String(body.areaId || '').trim(),
  };
}

async function renderPitchFormError(req, res, error, mode) {
  const pitchId = mode === 'edit' ? req.params.pitchId : null;
  const data = await ownerService.getPitchForm(pitchId, req.session.user);
  const existingPitch = data.pitch;

  return res.status(error.status || 422).render('owner/pitch-form', {
    title: mode === 'edit' ? 'Chỉnh sửa sân' : 'Thêm sân mới',
    pageDescription: 'Quản lý thông tin sân bóng thuộc tài khoản chủ sân.',
    mode,
    ...data,
    pitch: {
      ...(existingPitch || {}),
      ...formDataFromBody(req.body, existingPitch?.ma_san || ''),
      imageUrl: existingPitch?.imageUrl || '/images/pitch-default.svg',
    },
    formError: uploadErrorMessage(error),
  });
}

module.exports = {
  async status(req, res, next) {
    try {
      const data = await ownerService.getStatus();
      return res.json({ success: true, module: 'owner', data });
    } catch (error) {
      return next(error);
    }
  },

  async dashboardPage(req, res, next) {
    try {
      const data = await ownerService.getDashboard(req.session.user);
      return res.render('owner/dashboard', {
        title: 'Dashboard chủ sân',
        pageDescription: 'Tổng quan sân bóng và đơn đặt sân cần xử lý.',
        ...data,
      });
    } catch (error) {
      return next(error);
    }
  },

  async pitchListPage(req, res, next) {
    try {
      const data = await ownerService.getPitchList(req.session.user);
      return res.render('owner/pitch-list', {
        title: 'Quản lý sân bóng',
        pageDescription: 'Danh sách sân thuộc tài khoản chủ sân đang đăng nhập.',
        ...data,
      });
    } catch (error) {
      return next(error);
    }
  },

  async newPitchPage(req, res, next) {
    try {
      const data = await ownerService.getPitchForm(null, req.session.user);
      return res.render('owner/pitch-form', {
        title: 'Thêm sân mới',
        pageDescription: 'Thêm sân bóng mới vào hệ thống.',
        mode: 'create',
        ...data,
        pitch: null,
        formError: null,
      });
    } catch (error) {
      return next(error);
    }
  },

  async createPitch(req, res, next) {
    const imageUrl = req.file ? `/uploads/pitches/${req.file.filename}` : null;

    try {
      const pitch = await ownerService.createPitch(req.body, req.session.user, imageUrl);
      setFlash(req, 'success', `Đã thêm sân ${pitch.ten_san} (${pitch.ma_san}).`);
      await saveSession(req);
      return res.redirect('/chu-san/san-bong');
    } catch (error) {
      removeUploadedFile(req.file);
      if (error.status && error.status < 500) {
        try {
          return await renderPitchFormError(req, res, error, 'create');
        } catch (renderError) {
          return next(renderError);
        }
      }
      return next(error);
    }
  },

  async editPitchPage(req, res, next) {
    try {
      const data = await ownerService.getPitchForm(req.params.pitchId, req.session.user);
      return res.render('owner/pitch-form', {
        title: `Chỉnh sửa ${data.pitch.ten_san}`,
        pageDescription: 'Cập nhật thông tin sân bóng.',
        mode: 'edit',
        ...data,
        formError: null,
      });
    } catch (error) {
      return next(error);
    }
  },

  async updatePitch(req, res, next) {
    const imageUrl = req.file ? `/uploads/pitches/${req.file.filename}` : null;

    try {
      const result = await ownerService.updatePitch(
        req.params.pitchId,
        req.body,
        req.session.user,
        imageUrl,
      );

      if (imageUrl && result.previousImageUrl !== imageUrl) {
        removePublicPitchImage(result.previousImageUrl);
      }

      setFlash(req, 'success', `Đã cập nhật sân ${result.pitch.ten_san}.`);
      await saveSession(req);
      return res.redirect('/chu-san/san-bong');
    } catch (error) {
      removeUploadedFile(req.file);
      if (error.status && error.status < 500) {
        try {
          return await renderPitchFormError(req, res, error, 'edit');
        } catch (renderError) {
          return next(renderError);
        }
      }
      return next(error);
    }
  },

  async updatePitchStatus(req, res, next) {
    try {
      const pitch = await ownerService.updatePitchStatus(
        req.params.pitchId,
        req.body.status,
        req.session.user,
      );
      setFlash(req, 'success', `Đã chuyển ${pitch.ten_san} sang trạng thái ${pitch.statusMeta.label}.`);
      await saveSession(req);
      return res.redirect('/chu-san/san-bong');
    } catch (error) {
      if (error.status && error.status < 500) {
        setFlash(req, 'warning', error.message);
        await saveSession(req);
        return res.redirect('/chu-san/san-bong');
      }
      return next(error);
    }
  },

  async bookingListPage(req, res, next) {
    try {
      const data = await ownerService.getBookingList(req.query, req.session.user);
      return res.render('owner/booking-list', {
        title: 'Đơn đặt sân',
        pageDescription: 'Xem và xác nhận các đơn đặt sân thuộc hệ thống sân của bạn.',
        ...data,
      });
    } catch (error) {
      return next(error);
    }
  },

  async bookingDetailPage(req, res, next) {
    try {
      const booking = await ownerService.getBookingDetail(req.params.bookingId, req.session.user);
      return res.render('owner/booking-detail', {
        title: `Đơn ${booking.ma_dat_san}`,
        pageDescription: 'Chi tiết đơn đặt sân dành cho chủ sân.',
        booking,
      });
    } catch (error) {
      return next(error);
    }
  },

  async confirmBooking(req, res, next) {
    try {
      const booking = await ownerService.confirmBooking(req.params.bookingId, req.session.user);
      setFlash(req, 'success', `Đã xác nhận đơn ${booking.ma_dat_san}.`);
      await saveSession(req);
      return res.redirect(`/chu-san/don-dat-san/${encodeURIComponent(booking.ma_dat_san)}`);
    } catch (error) {
      if (error.status && error.status < 500) {
        setFlash(req, 'warning', error.message);
        await saveSession(req);
        return res.redirect(`/chu-san/don-dat-san/${encodeURIComponent(req.params.bookingId)}`);
      }
      return next(error);
    }
  },

  async apiDashboard(req, res, next) {
    try {
      const data = await ownerService.getDashboard(req.session.user);
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  },

  async apiPitches(req, res, next) {
    try {
      const data = await ownerService.getPitchList(req.session.user);
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  },

  async apiBookings(req, res, next) {
    try {
      const data = await ownerService.getBookingList(req.query, req.session.user);
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  },

  async apiConfirmBooking(req, res, next) {
    try {
      const booking = await ownerService.confirmBooking(req.params.bookingId, req.session.user);
      return res.json({ success: true, data: booking });
    } catch (error) {
      return next(error);
    }
  },
};
