const customerService = require('../services/customerService');

module.exports = {
  async status(req, res, next) {
    try {
      const data = await customerService.getStatus();
      return res.json({ success: true, module: 'customer', data });
    } catch (error) {
      return next(error);
    }
  },

  async summary(req, res, next) {
    try {
      const data = await customerService.getSummary(req.session.user);
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  },
};
