const express = require('express');
const homeController = require('../controllers/homeController');
const pitchController = require('../controllers/pitchController');
const authWebRoutes = require('./authWebRoutes');
const bookingWebRoutes = require('./bookingWebRoutes');
const ownerWebRoutes = require('./ownerWebRoutes');
const paymentWebRoutes = require('./paymentWebRoutes');
const adminWebRoutes = require('./adminWebRoutes');

const router = express.Router();

router.use('/', authWebRoutes);
router.use('/', bookingWebRoutes);
router.use('/', ownerWebRoutes);
router.use('/', paymentWebRoutes);
router.use('/', adminWebRoutes);

router.get('/', homeController.index);
router.get('/san-bong', pitchController.listPage);
router.get('/san-bong/:pitchId', pitchController.detailPage);

module.exports = router;
