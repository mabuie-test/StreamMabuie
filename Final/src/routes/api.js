const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Device = require('../models/Device');
const wsHandler = require('../ws/wsHandler');

router.get('/devices', auth, async (req,res)=>{
  const userId = req.user.userId;
  const devices = await Device.find({ owner: userId }).lean();
  const out = devices.map(d=>({ deviceId: d.deviceId, label: d.label, lastSeen: d.lastSeen, online: !!wsHandler.getLatest(d.deviceId) }));
  res.json({ ok: true, devices: out });
});

module.exports = router;
