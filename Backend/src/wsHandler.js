/**
 * server.js — alterações:
 * - raiz (/) serve login.html
 * - stream /stream/:deviceId exige token JWT
 * - frame upload /api/frame/:deviceId mantém suporte a token e upsert Device
 */
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

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stealthcam';

mongoose.connect(MONGO_URI).then(()=>console.log('Mongo connected')).catch(err=>console.error('Mongo err', err));

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// 1) Serve login na raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Static assets (JS, CSS, imagens, panel.html, viewer, etc.)
app.use('/', express.static(path.join(__dirname, 'public')));

// auth & api
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// 2) HTTP frame upload (raw image/jpeg)
// Accepts Authorization Bearer <token> OR token query param
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
        const payload = jwtUtils.verify(token);
        if (payload && payload.userId) userId = payload.userId;
      } catch (e) {
        // invalid token -> ignore owner, still accept frame (or you can return 401 here)
        console.warn('frame upload: invalid token (ignored)');
      }
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
    console.error('frame upload error', e);
    res.status(500).send('err');
  }
});

// 3) MJPEG stream — agora exige token válido
app.get('/stream/:deviceId', (req, res) => {
  const id = req.params.deviceId;

  // extrair token (Authorization header ou query token)
  let token = null;
  if (req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ')) {
    token = req.headers['authorization'].slice(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  // validar token
  try {
    if (!token) return res.status(401).send('unauthorized');
    const payload = jwtUtils.verify(token);
    // opcional: validar ownership aqui se necessitares
  } catch (e) {
    return res.status(401).send('invalid token');
  }

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
wsHandler.attach(server); // will handle /ws upgrades
server.listen(PORT, ()=>console.log(`Server listening on ${PORT}`));
