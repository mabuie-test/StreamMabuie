require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');

const wsHandler = require('./wsHandler');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const jwtUtils = require('./utils/jwt');
const Device = require('./models/Device');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stealthcam';

mongoose.connect(MONGO_URI)
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>{ console.error('Mongo connect error', err); process.exit(1); });

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// root: redirect to login (enforce auth via UI)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// static assets
app.use('/', express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Frame upload (from device) - accepts Authorization Bearer or ?token=
app.post('/api/frame/:deviceId', express.raw({ type: ['image/jpeg','application/octet-stream'], limit: `${process.env.MAX_FRAME_MB || 3}mb` }), async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    if (!req.body || !req.body.length) return res.status(400).send('empty');
    // token from header or query
    let token = null;
    if (req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ')) token = req.headers['authorization'].slice(7);
    if (!token && req.query && req.query.token) token = req.query.token;
    let userId = null;
    if (token) {
      try { const payload = jwtUtils.verify(token); userId = payload.userId; } catch(e) { console.warn('invalid token on frame upload'); }
    }
    const buf = Buffer.from(req.body);
    wsHandler.setLatest(deviceId, buf);
    wsHandler.forwardToViewers(deviceId, buf);
    // upsert device and set owner if token valid
    const update = { lastSeen: new Date() };
    if (userId) update.owner = userId;
    await Device.findOneAndUpdate({ deviceId }, update, { upsert: true, setDefaultsOnInsert: true });
    return res.status(200).send('ok');
  } catch (e) {
    console.error('frame upload error', e);
    return res.status(500).send('err');
  }
});

// MJPEG stream - owner-only: require token and that user is owner
app.get('/stream/:deviceId', async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    // token in header or query
    let token = null;
    if (req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ')) token = req.headers['authorization'].slice(7);
    if (!token && req.query && req.query.token) token = req.query.token;
    if (!token) return res.status(401).send('no token');
    let payload;
    try { payload = jwtUtils.verify(token); } catch(e) { return res.status(401).send('invalid token'); }
    // verify owner
    const dev = await Device.findOne({ deviceId }).lean();
    if (!dev || !dev.owner || dev.owner.toString() !== payload.userId) return res.status(403).send('forbidden');
    // stream MJPEG
    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=--frame',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    let last = null;
    const t = setInterval(() => {
      const frame = wsHandler.getLatest(deviceId);
      if (frame && frame !== last) {
        res.write('--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ' + frame.length + '\r\n\r\n');
        res.write(frame);
        res.write('\r\n');
        last = frame;
      }
    }, 120);
    req.on('close', () => clearInterval(t));
  } catch (e) {
    console.error('stream error', e);
    try { res.status(500).send('err'); } catch(_) {}
  }
});

// start and attach ws
const server = http.createServer(app);
wsHandler.attach(server);
server.listen(PORT, ()=>console.log(`Server listening on ${PORT}`));
