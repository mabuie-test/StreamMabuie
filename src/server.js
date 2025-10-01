require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const mongoose = require('mongoose');

const wsHandler = require('./wsHandler');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stealthcam';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>console.error('Mongo connect error', err));

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// rate limiter basic
app.use(rateLimit({ windowMs: 10*1000, max: 100 }));

// static frontend
app.use('/', express.static(path.join(__dirname, 'public')));

// auth & api
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// endpoint to receive frames by POST (android http upload)
app.post('/api/frame/:deviceId', express.raw({ type: ['image/jpeg','application/octet-stream'], limit: `${process.env.MAX_FRAME_MB || 3}mb` }), (req, res) => {
  const deviceId = req.params.deviceId;
  if (!req.body || req.body.length === 0) return res.status(400).send('empty');
  const buf = Buffer.from(req.body);
  wsHandler.setLatest(deviceId, buf);
  wsHandler.forwardToViewers(deviceId, buf);
  res.status(200).send('ok');
});

// MJPEG endpoint (multipart)
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

// start server and attach WS
const server = http.createServer(app);
wsHandler.attach(server); // will handle upgrades at /ws
server.listen(PORT, ()=>console.log(`Server listening on ${PORT}`));
