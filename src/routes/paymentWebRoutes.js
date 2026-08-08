const express = require('express');
const paymentController = require('../controllers/paymentController');
const { requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();
const customerOnly = requireRole('Khach hang');

router.get('/dat-san/:bookingId/hoa-don', customerOnly, paymentController.invoicePage);
router.post('/dat-san/:bookingId/dich-vu', customerOnly, paymentController.addService);
router.post('/dat-san/:bookingId/dich-vu/:serviceId/xoa', customerOnly, paymentController.removeService);
router.post('/dat-san/:bookingId/thanh-toan', customerOnly, paymentController.pay);

module.exports = router;
