const bookingService = require('../services/bookingService');
const { saveSession, setFlash } = require('../utils/session');

function selectedPitchPath(input) {
  const pitchId = encodeURIComponent(String(input.pitchId || '').trim());
  const date = encodeURIComponent(String(input.date || '').trim());
  return `/san-bong/${pitchId}?date=${date}#lich-trong`;
}

module.exports = {
  async status(req, res, next) {
    try {
      const data = await bookingService.getStatus();
      res.json({ success: true, module: 'booking', data });
    } catch (error) {
      next(error);
    }
  },

  async preparePage(req, res, next) {
    try {
      const data = await bookingService.prepareBooking(req.query, req.session.user);
      res.render('booking/prepare', {
        title: 'Kiểm tra thông tin đặt sân',
        pageDescription: 'Kiểm tra sân, ngày và khung giờ trước khi xác nhận đặt sân.',
        ...data,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const booking = await bookingService.createBooking(req.body, req.session.user);
      setFlash(req, 'success', `Đặt sân thành công. Mã đơn của bạn là ${booking.ma_dat_san}.`);
      await saveSession(req);
      return res.redirect(`/dat-san/${encodeURIComponent(booking.ma_dat_san)}`);
    } catch (error) {
      if (error.code === 'TIME_SLOT_UNAVAILABLE') {
        setFlash(req, 'warning', error.message);
        await saveSession(req);
        return res.redirect(selectedPitchPath(req.body));
      }
      return next(error);
    }
  },

  async historyPage(req, res, next) {
    try {
      const data = await bookingService.getBookingHistory(req.query, req.session.user);
      return res.render('booking/history', {
        title: 'Lịch sử đặt sân',
        pageDescription: 'Theo dõi các đơn đặt sân của bạn.',
        ...data,
      });
    } catch (error) {
      return next(error);
    }
  },

  async detailPage(req, res, next) {
    try {
      const booking = await bookingService.getBookingDetail(req.params.bookingId, req.session.user);
      return res.render('booking/detail', {
        title: `Đơn ${booking.ma_dat_san}`,
        pageDescription: `Chi tiết đơn đặt sân ${booking.ma_dat_san}.`,
        booking,
      });
    } catch (error) {
      return next(error);
    }
  },

  async cancel(req, res, next) {
    try {
      const booking = await bookingService.cancelBooking(req.params.bookingId, req.session.user);
      setFlash(req, 'success', `Đã hủy đơn ${booking.ma_dat_san}. Khung giờ đã được mở lại.`);
      await saveSession(req);
      return res.redirect(`/dat-san/${encodeURIComponent(booking.ma_dat_san)}`);
    } catch (error) {
      if (error.status && error.status < 500) {
        setFlash(req, 'warning', error.message);
        await saveSession(req);
        return res.redirect(`/dat-san/${encodeURIComponent(req.params.bookingId)}`);
      }
      return next(error);
    }
  },

  async apiList(req, res, next) {
    try {
      const data = await bookingService.getBookingHistory(req.query, req.session.user);
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  },

  async apiCreate(req, res, next) {
    try {
      const booking = await bookingService.createBooking(req.body, req.session.user);
      return res.status(201).json({ success: true, data: booking });
    } catch (error) {
      return next(error);
    }
  },

  async apiDetail(req, res, next) {
    try {
      const booking = await bookingService.getBookingDetail(req.params.bookingId, req.session.user);
      return res.json({ success: true, data: booking });
    } catch (error) {
      return next(error);
    }
  },

  async apiCancel(req, res, next) {
    try {
      const booking = await bookingService.cancelBooking(req.params.bookingId, req.session.user);
      return res.json({ success: true, data: booking });
    } catch (error) {
      return next(error);
    }
  },
};
