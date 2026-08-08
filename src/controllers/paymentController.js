const paymentService = require('../services/paymentService');
const { saveSession, setFlash } = require('../utils/session');

function invoicePath(bookingId) {
  return `/dat-san/${encodeURIComponent(bookingId)}/hoa-don`;
}

async function flashAndRedirect(req, res, message, type = 'success') {
  setFlash(req, type, message);
  await saveSession(req);
  return res.redirect(invoicePath(req.params.bookingId));
}

module.exports = {
  async status(req, res, next) {
    try {
      const data = await paymentService.getStatus();
      return res.json({ success: true, module: 'payment', data });
    } catch (error) {
      return next(error);
    }
  },

  async invoicePage(req, res, next) {
    try {
      const data = await paymentService.getInvoiceData(req.params.bookingId, req.session.user);
      return res.render('payment/invoice', {
        title: `Hóa đơn ${data.invoice.ma_dat_san}`,
        pageDescription: 'Chọn dịch vụ và thanh toán hóa đơn đặt sân.',
        ...data,
      });
    } catch (error) {
      return next(error);
    }
  },

  async addService(req, res, next) {
    try {
      await paymentService.addService(req.params.bookingId, req.body, req.session.user);
      return flashAndRedirect(req, res, 'Đã thêm dịch vụ vào hóa đơn.');
    } catch (error) {
      if (error.status && error.status < 500) {
        return flashAndRedirect(req, res, error.message, 'warning');
      }
      return next(error);
    }
  },

  async removeService(req, res, next) {
    try {
      await paymentService.removeService(
        req.params.bookingId,
        req.params.serviceId,
        req.session.user,
      );
      return flashAndRedirect(req, res, 'Đã xóa dịch vụ khỏi hóa đơn.');
    } catch (error) {
      if (error.status && error.status < 500) {
        return flashAndRedirect(req, res, error.message, 'warning');
      }
      return next(error);
    }
  },

  async pay(req, res, next) {
    try {
      await paymentService.pay(req.params.bookingId, req.session.user);
      return flashAndRedirect(req, res, 'Thanh toán hóa đơn thành công.');
    } catch (error) {
      if (error.status && error.status < 500) {
        return flashAndRedirect(req, res, error.message, 'warning');
      }
      return next(error);
    }
  },

  async apiInvoice(req, res, next) {
    try {
      const data = await paymentService.getInvoiceData(req.params.bookingId, req.session.user);
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  },

  async apiAddService(req, res, next) {
    try {
      await paymentService.addService(req.params.bookingId, req.body, req.session.user);
      const data = await paymentService.getInvoiceData(req.params.bookingId, req.session.user);
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  },

  async apiRemoveService(req, res, next) {
    try {
      await paymentService.removeService(req.params.bookingId, req.params.serviceId, req.session.user);
      const data = await paymentService.getInvoiceData(req.params.bookingId, req.session.user);
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  },

  async apiPay(req, res, next) {
    try {
      await paymentService.pay(req.params.bookingId, req.session.user);
      const data = await paymentService.getInvoiceData(req.params.bookingId, req.session.user);
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  },
};
