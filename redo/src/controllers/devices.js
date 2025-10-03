
const Device = require('../models/Device');
const ws = require('../services/wsService');

exports.list = async (req,res) => {
  try {
    const userId = req.user.userId;
    const devices = await Device.find({ owner: userId }).select('deviceId label lastSeen').lean();
    const enriched = devices.map(d=>({ deviceId: d.deviceId, label: d.label, lastSeen: d.lastSeen, online: !!ws.getLatest(d.deviceId) }));
    res.json({ ok:true, devices: enriched });
  } catch(e){ res.status(500).json({ error: e.message }); }
};

exports.add = async (req,res) => {
  try {
    const { deviceId, label } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'missing' });
    await Device.findOneAndUpdate({ deviceId }, { owner: req.user.userId, label: label || '', lastSeen: new Date() }, { upsert:true, setDefaultsOnInsert:true });
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ error: e.message }); }
};
