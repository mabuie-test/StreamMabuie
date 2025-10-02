const Device = require('../models/Device');
const wsHandler = require('../wsHandler');

exports.devicesForUser = async (req,res) => {
  try {
    const userId = req.user.userId;
    const devices = await Device.find({ owner: userId }).select('deviceId label lastSeen').lean();
    const enriched = devices.map(d => ({ ...d, online: !!wsHandler.getLatest(d.deviceId) }));
    res.json({ ok: true, devices: enriched });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.deviceInfo = async (req,res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;
    const device = await Device.findOne({ deviceId: id, owner: userId }).lean();
    if (!device) return res.status(404).json({ error: 'not found' });
    const frame = wsHandler.getLatest(id);
    res.json({ ok: true, device, hasFrame: !!frame });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
