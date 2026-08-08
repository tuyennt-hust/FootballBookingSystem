const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Football Booking System API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      bookings: '/api/bookings',
      customers: '/api/customers',
      owners: '/api/owners',
      pitches: '/api/pitches',
      payments: '/api/payments',
      admin: '/api/admin',
    },
  });
});

router.get('/health', healthController.getHealth);
router.use('/auth', require('./authRoutes'));
router.use('/bookings', require('./bookingRoutes'));
router.use('/customers', require('./customerRoutes'));
router.use('/owners', require('./ownerRoutes'));
router.use('/pitches', require('./pitchRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
