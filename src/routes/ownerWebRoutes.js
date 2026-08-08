const express = require('express');
const ownerController = require('../controllers/ownerController');
const { requireRole } = require('../middlewares/authMiddleware');
const { multipartCsrfProtection } = require('../middlewares/csrfMiddleware');
const {
  pitchImageUpload,
  removeUploadedFile,
  validatePitchImageSignature,
} = require('../middlewares/uploadMiddleware');

const router = express.Router();

function verifyMultipartCsrf(req, res, next) {
  return multipartCsrfProtection(req, res, (error) => {
    if (error) removeUploadedFile(req.file);
    return next(error);
  });
}

router.use('/chu-san', requireRole('Chu san'));

router.get('/chu-san', ownerController.dashboardPage);
router.get('/chu-san/san-bong', ownerController.pitchListPage);
router.get('/chu-san/san-bong/them', ownerController.newPitchPage);
router.post(
  '/chu-san/san-bong',
  pitchImageUpload.single('image'),
  validatePitchImageSignature,
  verifyMultipartCsrf,
  ownerController.createPitch,
);
router.get('/chu-san/san-bong/:pitchId/chinh-sua', ownerController.editPitchPage);
router.post(
  '/chu-san/san-bong/:pitchId/chinh-sua',
  pitchImageUpload.single('image'),
  validatePitchImageSignature,
  verifyMultipartCsrf,
  ownerController.updatePitch,
);
router.post('/chu-san/san-bong/:pitchId/trang-thai', ownerController.updatePitchStatus);

router.get('/chu-san/don-dat-san', ownerController.bookingListPage);
router.get('/chu-san/don-dat-san/:bookingId', ownerController.bookingDetailPage);
router.post('/chu-san/don-dat-san/:bookingId/xac-nhan', ownerController.confirmBooking);

module.exports = router;
