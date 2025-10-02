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

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stealthcam';

mongoose.connect(MONGO_URI).then(()=>console.log('Mongo connected')).catch(err=>console.error('Mongo err', err));

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/', express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// HTTP frame upload (raw image/jpeg)
app.post('/api/frame/:deviceId', express.raw({ type: ['image/jpeg','application/octet-stream'], limit: `${process.env.MAX_FRAME_MB || 3}mb` }), async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    if (!req.body || req.body.length === 0) return res.status(400).send('empty body');

    // token from Authorization header or query
    let token = null;
    if (req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ')) token = req.headers['authorization'].slice(7);
    if (!token && req.query && req.query.token) token = req.query.token;

    let userId = null;
    if (token) {
      try {
        const jwt = require('./utils/jwt');
        const payload = jwt.verify(token);
        userId = payload.userId;
      } catch(e) { /* invalid token, ignore owner */ }
    }

    const buf = Buffer.from(req.body);
    wsHandler.setLatest(deviceId, buf);
    wsHandler.forwardToViewers(deviceId, buf);

    // upsert device and set owner if userId present
    const Device = require('./models/Device');
    const update = { lastSeen: new Date() };
    if (userId) update.owner = userId;
    await Device.findOneAndUpdate({ deviceId }, update, { upsert: true, setDefaultsOnInsert: true });

    res.status(200).send('ok');
  } catch (e) {
    console.error(e);
    res.status(500).send('err');
  }
});

// MJPEG stream
app.get('/stream/:deviceId', (req, res) => {
  const id = req.params.deviceId;
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--frame',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  let last = null;
  const t = setInterval(() => {
    const frame = wsHandler.getLatest(id);
    if (frame && frame !== last) {
      res.write('--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ' + frame.length + '\r\n\r\n');
      res.write(frame);
      res.write('\r\n');
      last = frame;
    }
  }, 150);
  req.on('close', () => clearInterval(t));
});

const server = http.createServer(app);
wsHandler.attach(server);
server.listen(PORT, ()=>console.log(`Server listening on ${PORT}`));
