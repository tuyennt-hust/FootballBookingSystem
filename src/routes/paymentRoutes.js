const express = require('express');
const paymentController = require('../controllers/paymentController');
const { requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();
const customerOnly = requireRole('Khach hang');

router.get('/status', paymentController.status);
router.get('/:bookingId', customerOnly, paymentController.apiInvoice);
router.post('/:bookingId/services', customerOnly, paymentController.apiAddService);
router.post('/:bookingId/services/:serviceId/remove', customerOnly, paymentController.apiRemoveService);
router.post('/:bookingId/pay', customerOnly, paymentController.apiPay);

module.exports = router;
