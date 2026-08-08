const pitchService = require('../services/pitchService');

module.exports = {
  async status(req, res, next) {
    try {
      const data = await pitchService.getStatus();
      res.json({ success: true, module: 'pitch', data });
    } catch (error) {
      next(error);
    }
  },

  async listPage(req, res, next) {
    try {
      const data = await pitchService.getPublicPitchList(req.query);
      res.render('pitch/list', {
        title: 'Danh sách sân bóng',
        pageDescription: 'Danh sách sân bóng đang hoạt động trong hệ thống.',
        ...data,
      });
    } catch (error) {
      next(error);
    }
  },

  async detailPage(req, res, next) {
    try {
      const data = await pitchService.getPublicPitchDetail(req.params.pitchId, req.query);
      res.render('pitch/detail', {
        title: data.pitch.ten_san,
        pageDescription: `Xem thông tin và lịch trống của ${data.pitch.ten_san}.`,
        ...data,
      });
    } catch (error) {
      next(error);
    }
  },

  async availability(req, res, next) {
    try {
      const data = await pitchService.getPublicAvailability(req.params.pitchId, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};
