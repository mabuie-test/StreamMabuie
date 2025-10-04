const express = require('express');
const router = express.Router();
const multer = require('multer');
const Device = require('../models/Device');
const { authMiddleware } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2_000_000 } });

// create device (user creates device record, gets generated key)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { deviceId, name } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });
    if (await Device.findOne({ deviceId })) return res.status(400).json({ error: 'device exists' });

    const key = Math.random().toString(36).slice(2, 16);
    const d = new Device({ deviceId, name, owner: req.user.id, key });
    await d.save();
    res.json({ device: d });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// list devices for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const devices = await Device.find({ owner: req.user.id }).select('-__v');
    res.json({ devices });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// upload frame from device -> public (device authenticates with ?key= or header x-device-key)
router.post('/:deviceId/frame', upload.single('frame'), async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const keyHeader = req.headers['x-device-key'] || req.query.key;
    const device = await Device.findOne({ deviceId });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    if (device.key && keyHeader !== device.key) return res.status(401).json({ error: 'Device key invalid' });
    if (!req.file) return res.status(400).json({ error: 'No frame' });

    // store in memory map handled in server.js (we'll use exported function via global)
    // write to GridFS optional handled in server.js (we'll call a global function)
    // Put the buffer into a shared place: we'll use a simple global map on global.latestFrames
    if (!global.latestFrames) global.latestFrames = new Map();
    global.latestFrames.set(deviceId, { buffer: req.file.buffer, contentType: req.file.mimetype, ts: Date.now() });

    // broadcast to ws clients: server.js will hold ws map and a broadcast function as global
    if (global.broadcastFrame) global.broadcastFrame(deviceId, req.file.buffer);

    // optional save to GridFS via query ?save=true (server.js handles GridFS directly)
    res.sendStatus(204);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// get last frame (debug)
router.get('/:deviceId/last.jpg', async (req, res) => {
  const deviceId = req.params.deviceId;
  const map = global.latestFrames || new Map();
  const entry = map.get(deviceId);
  if (!entry) return res.sendStatus(404);
  res.set('Content-Type', entry.contentType || 'image/jpeg');
  res.send(entry.buffer);
});

module.exports = router;
