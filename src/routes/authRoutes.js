const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/status', authController.status);
router.get('/me', requireAuth, authController.me);
router.get('/csrf', requireAuth, authController.csrf);

module.exports = router;
