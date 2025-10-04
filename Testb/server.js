require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');

const authRoutes = require('./routes/auth');
const devicesRoutes = require('./routes/devices');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI missing in .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI);
const conn = mongoose.connection;
conn.on('error', console.error);
conn.once('open', () => console.log('MongoDB connected'));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', devicesRoutes);

// In-memory map for latest frames
global.latestFrames = new Map();

// GridFS bucket setup
let gfsBucket = null;
conn.once('open', () => {
  gfsBucket = new GridFSBucket(conn.db, { bucketName: 'frames' });
  global.gfsBucket = gfsBucket;
});

// MJPEG stream endpoint using global.latestFrames
app.get('/api/stream/:deviceId/mjpeg', (req, res) => {
  const deviceId = req.params.deviceId;
  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    'Connection': 'close',
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
  });

  const sendFrame = () => {
    const e = global.latestFrames.get(deviceId);
    if (!e) return;
    res.write('--frame\r\n');
    res.write(`Content-Type: ${e.contentType || 'image/jpeg'}\r\n`);
    res.write(`Content-Length: ${e.buffer.length}\r\n\r\n`);
    res.write(e.buffer);
    res.write('\r\n');
  };

  // send at interval until connection closed
  const iv = setInterval(sendFrame, 250); // 4fps
  req.on('close', () => clearInterval(iv));
});

// Simple recordings list and download (GridFS)
app.get('/api/recordings/:deviceId', async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    if (!global.gfsBucket) return res.json({ recordings: [] });
    const cursor = global.gfsBucket.find({ 'metadata.deviceId': deviceId }).sort({ uploadDate: -1 }).limit(50);
    const arr = await cursor.toArray();
    res.json({ recordings: arr.map(a => ({ id: a._id, filename: a.filename, uploadDate: a.uploadDate })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/recordings/:deviceId/:fileId', (req, res) => {
  try {
    const fileId = req.params.fileId;
    const { ObjectId } = require('mongodb');
    const _id = new ObjectId(fileId);
    if (!global.gfsBucket) return res.status(500).json({ error: 'gfs not ready' });
    const download = global.gfsBucket.openDownloadStream(_id);
    download.on('error', () => res.sendStatus(404));
    res.set('Content-Type', 'image/jpeg');
    download.pipe(res);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// create HTTP server and WS server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const wsClientsByDevice = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'subscribe' && data.deviceId) {
        ws.deviceId = data.deviceId;
        if (!wsClientsByDevice.has(data.deviceId)) wsClientsByDevice.set(data.deviceId, new Set());
        wsClientsByDevice.get(data.deviceId).add(ws);
      }
    } catch (e) {
      // ignore
    }
  });

  ws.on('close', () => {
    if (ws.deviceId && wsClientsByDevice.has(ws.deviceId)) {
      wsClientsByDevice.get(ws.deviceId).delete(ws);
    }
  });
});

// expose broadcast function to routes
global.broadcastFrame = (deviceId, buffer) => {
  const set = wsClientsByDevice.get(deviceId);
  if (!set) return;
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) {
      try { ws.send(buffer); } catch (e) { /* ignore */ }
    }
  }
};

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
