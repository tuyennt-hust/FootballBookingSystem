const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth, requireGuest } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/dang-nhap', requireGuest, authController.showLogin);
router.post('/dang-nhap', requireGuest, authController.login);
router.get('/dang-ky', requireGuest, authController.showRegister);
router.post('/dang-ky', requireGuest, authController.register);
router.get('/tai-khoan', requireAuth, authController.profile);
router.post('/dang-xuat', requireAuth, authController.logout);

module.exports = router;
