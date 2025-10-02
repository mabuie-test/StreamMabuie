const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const apiCtrl = require('../controllers/apiController');

router.get('/devices', auth, apiCtrl.devicesForUser);
router.get('/device/:id/info', auth, apiCtrl.deviceInfo);

module.exports = router;
