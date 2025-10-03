const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Device = require('../models/Device');

router.post('/device/add', auth, async (req,res)=>{
  const { deviceId, label } = req.body;
  if(!deviceId) return res.status(400).json({ error: 'missing' });
  try {
    await Device.findOneAndUpdate({ deviceId }, { label, owner: req.user.userId, lastSeen: new Date() }, { upsert: true, setDefaultsOnInsert: true });
    res.json({ ok: true });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

module.exports = router;
