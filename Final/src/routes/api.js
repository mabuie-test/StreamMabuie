const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Device = require('../models/Device');
const wsHandler = require('../ws/wsHandler');

router.get('/devices', auth, async (req,res)=>{
  try {
    const userId = req.user.userId;
    const devices = await Device.find({ owner: userId }).select('deviceId label lastSeen').lean();
    const enriched = devices.map(d => ({ deviceId: d.deviceId, label: d.label, lastSeen: d.lastSeen, online: !!wsHandler.getLatest(d.deviceId) }));
    res.json({ ok: true, devices: enriched });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

module.exports = router;
