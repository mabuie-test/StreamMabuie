
require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const connect = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/stealthcam';
  await mongoose.connect(uri);
  console.log('Mongo connected');
};
connect().catch(e=>{ console.error(e); process.exit(1); });

const wsService = require('./services/wsService');

const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan('tiny'));
app.use(express.json({ limit:'5mb' }));
app.use(express.urlencoded({ extended:true }));
// debug endpoints (coloca perto dos outros routes)
app.get('/api/ping', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.post('/api/debug-log', express.text({ type: '*/*' }), (req, res) => {
  console.log('DEBUG_LOG POST body:', req.headers['content-type'], req.body ? req.body.toString().slice(0,2000) : '(empty)');
  res.json({ok:true});
});

// serve frontend from /public_web (new tree)
app.use('/', express.static(path.resolve(__dirname, 'public_web')));

// auth and api
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// raw frame upload
app.post('/api/frame/:deviceId', express.raw({ type: ['image/jpeg','application/octet-stream'], limit: `${process.env.MAX_FRAME_MB || 3}mb` }), async (req,res)=>{
  try {
    if (!req.body || req.body.length===0) return res.status(400).send('empty');
    const id = req.params.deviceId;
    const buf = Buffer.from(req.body);
    // set lastSeen and maybe owner from Bearer token
    const Device = require('./models/Device');
    let owner = null;
    const h = req.headers['authorization'];
    if (h && h.startsWith('Bearer ')) {
      try { const p = require('./utils/jwt').verify(h.slice(7)); owner = p.userId; } catch(e){}
    }
    const update = { lastSeen: new Date() };
    if (owner) update.owner = owner;
    await Device.findOneAndUpdate({ deviceId: id }, update, { upsert:true, setDefaultsOnInsert:true });
    const ws = require('./services/wsService');
    ws.setLatest(id, buf);
    ws.forward(id, buf);
    res.status(200).send('ok');
  } catch(e){ console.error(e); res.status(500).send('err'); }
});

// mjpeg stream
app.get('/stream/:deviceId', (req,res)=>{
  const id = req.params.deviceId;
  res.writeHead(200, {'Content-Type':'multipart/x-mixed-replace; boundary=--frame', 'Cache-Control':'no-cache', 'Connection':'keep-alive'});
  let last = null;
  const t = setInterval(()=> {
    const f = require('./services/wsService').getLatest(id);
    if (f && f !== last) {
      res.write('--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ' + f.length + '\r\n\r\n');
      res.write(f);
      res.write('\r\n');
      last = f;
    }
  }, 150);
  req.on('close', ()=> clearInterval(t));
});

const server = http.createServer(app);
wsService.attach(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log('Server listening on', PORT));
