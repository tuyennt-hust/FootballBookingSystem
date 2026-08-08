const express = require('express');
const bookingController = require('../controllers/bookingController');
const { requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();
const customerOnly = requireRole('Khach hang');

router.get('/dat-san/tao', customerOnly, bookingController.preparePage);
router.post('/dat-san', customerOnly, bookingController.create);
router.get('/lich-su-dat-san', customerOnly, bookingController.historyPage);
router.get('/dat-san/:bookingId', customerOnly, bookingController.detailPage);
router.post('/dat-san/:bookingId/huy', customerOnly, bookingController.cancel);

module.exports = router;
