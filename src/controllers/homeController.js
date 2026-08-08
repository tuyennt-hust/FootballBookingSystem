const pitchService = require('../services/pitchService');

module.exports = {
  async index(req, res, next) {
    try {
      const data = await pitchService.getHomePageData();
      res.render('home/index', {
        title: 'Đặt sân bóng nhanh chóng',
        pageDescription: 'Tìm kiếm và đặt sân bóng phù hợp theo khu vực, loại sân và mức giá.',
        ...data,
      });
    } catch (error) {
      next(error);
    }
  },
};
