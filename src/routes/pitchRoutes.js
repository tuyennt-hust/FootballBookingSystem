const express = require('express');
const pitchController = require('../controllers/pitchController');

const router = express.Router();
router.get('/status', pitchController.status);
router.get('/:pitchId/availability', pitchController.availability);

module.exports = router;
