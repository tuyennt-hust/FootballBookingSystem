const express = require('express');
const ownerController = require('../controllers/ownerController');
const { requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(requireRole('Chu san'));

router.get('/status', ownerController.status);
router.get('/dashboard', ownerController.apiDashboard);
router.get('/pitches', ownerController.apiPitches);
router.get('/bookings', ownerController.apiBookings);
router.post('/bookings/:bookingId/confirm', ownerController.apiConfirmBooking);

module.exports = router;
