const express = require('express');
const customerController = require('../controllers/customerController');
const { requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/status', customerController.status);
router.get('/summary', requireRole('Khach hang'), customerController.summary);

module.exports = router;
