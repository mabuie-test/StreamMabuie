
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const devCtrl = require('../controllers/devices');

router.get('/devices', auth, devCtrl.list);
router.post('/device/add', auth, devCtrl.add);

module.exports = router;
