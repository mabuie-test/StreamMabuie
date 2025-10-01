const wsHandler = require('../wsHandler');

exports.devices = async (req, res) => {
  try {
    const devices = wsHandler.listDevices();
    res.json({ ok: true, devices });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.deviceInfo = async (req, res) => {
  const id = req.params.id;
  try {
    const frame = wsHandler.getLatest(id);
    res.json({ ok: true, deviceId: id, hasFrame: !!frame });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
