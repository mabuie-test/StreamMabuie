require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const deviceRoutes = require('./routes/deviceRoutes');
const wsHandler = require('./ws/wsHandler');

const PORT = process.env.PORT || 3000;
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/stealthcam';

mongoose.connect(MONGO)
  .then(()=>console.log('Mongo connected'))
  .catch(err=>console.error('Mongo error', err));

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan('tiny'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// redirect root to login
app.get('/', (req,res)=> res.redirect('/login.html'));

// static front-end
// ou de forma robusta:
app.use('/', express.static(path.resolve(__dirname, '..', 'public')));

// api
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', deviceRoutes);

// frame upload endpoint
app.post('/api/frame/:deviceId', express.raw({ type: ['image/jpeg','application/octet-stream'], limit: `${process.env.MAX_FRAME_MB||3}mb` }), async (req,res)=>{
  try {
    if(!req.body || !req.body.length) return res.status(400).send('empty');
    const deviceId = req.params.deviceId;
    const buf = Buffer.from(req.body);

    // try owner resolve using token header (optional)
    let owner = null;
    const auth = req.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const jwt = require('./utils/jwt');
        const p = jwt.verify(auth.slice(7));
        owner = p.userId;
      } catch(e){}
    }

    wsHandler.setLatest(deviceId, buf);
    wsHandler.forwardToViewers(deviceId, buf);

    const Device = require('./models/Device');
    const update = { lastSeen: new Date() };
    if (owner) update.owner = owner;
    await Device.findOneAndUpdate({ deviceId }, update, { upsert: true, setDefaultsOnInsert: true });

    res.send('ok');
  } catch(e){
    console.error('frame err', e);
    res.status(500).send('err');
  }
});

// MJPEG stream
app.get('/stream/:deviceId', (req,res)=>{
  const id = req.params.deviceId;
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--frame',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  let last = null;
  const t = setInterval(()=>{
    const frame = wsHandler.getLatest(id);
    if(frame && frame !== last){
      res.write('--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ' + frame.length + '\r\n\r\n');
      res.write(frame);
      res.write('\r\n');
      last = frame;
    }
  }, 150);
  req.on('close', ()=> clearInterval(t));
});

const server = http.createServer(app);
wsHandler.attach(server);

server.listen(PORT, ()=> console.log(`Server running on ${PORT}`));
