const express = require('express');
const router = express.Router();
const apiCtrl = require('../controllers/apiController');

router.get('/devices', apiCtrl.devices); // list devices (latest known)
router.get('/device/:id/info', apiCtrl.deviceInfo);

module.exports = router;
