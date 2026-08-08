const express = require('express');
const bookingController = require('../controllers/bookingController');
const { requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();
const customerOnly = requireRole('Khach hang');

router.get('/status', bookingController.status);
router.get('/', customerOnly, bookingController.apiList);
router.post('/', customerOnly, bookingController.apiCreate);
router.get('/:bookingId', customerOnly, bookingController.apiDetail);
router.post('/:bookingId/cancel', customerOnly, bookingController.apiCancel);

module.exports = router;
