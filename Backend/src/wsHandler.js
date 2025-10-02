const WebSocket = require('ws');
const url = require('url');
const jwtUtils = require('./utils/jwt');
const Device = require('./models/Device');

const latestFrames = {};   // deviceId -> Buffer
const viewers = {};        // deviceId -> Set(ws)
const cameras = new Map(); // ws -> {deviceId,userId}

function attach(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const parsed = url.parse(req.url, true);
    if (parsed.pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => { wss.emit('connection', ws, req); });
    } else socket.destroy();
  });

  wss.on('connection', async (ws, req) => {
    const q = url.parse(req.url, true).query;
    if (q.deviceId) {
      let userId = null;
      try {
        if (q.token) {
          const payload = jwtUtils.verify(q.token);
          userId = payload.userId;
        }
      } catch(e) { /* invalid token -> ignore */ }

      const dev = q.deviceId;
      cameras.set(ws, { deviceId: dev, userId });
      console.log('camera connected', dev, 'owner=', userId);

      try {
        const update = { lastSeen: new Date() };
        if (userId) update.owner = userId;
        await Device.findOneAndUpdate({ deviceId: dev }, update, { upsert: true, setDefaultsOnInsert: true });
      } catch(e){ console.error('device upsert err', e); }

      ws.on('message', (msg) => {
        if (typeof msg === 'string') return;
        const buf = Buffer.from(msg);
        latestFrames[dev] = buf;
        const set = viewers[dev];
        if (set) for (const v of set) if (v.readyState === WebSocket.OPEN) v.send(buf);
      });

      ws.on('close', ()=> { cameras.delete(ws); console.log('camera disconnected', dev); });
      ws.on('error', ()=> { cameras.delete(ws); });
    }
    else if (q.viewerFor) {
      const dev = q.viewerFor;
      viewers[dev] = viewers[dev] || new Set();
      viewers[dev].add(ws);
      if (latestFrames[dev]) {
        try { ws.send(latestFrames[dev]); } catch(e){}
      }
      ws.on('close', ()=> viewers[dev].delete(ws));
      ws.on('error', ()=> viewers[dev].delete(ws));
    } else {
      ws.close();
    }
  });

  console.log('WS attached at /ws');
}

function getLatest(deviceId) { return latestFrames[deviceId]; }
function setLatest(deviceId, buffer) { latestFrames[deviceId] = buffer; }
function forwardToViewers(deviceId, buffer) {
  const set = viewers[deviceId];
  if (!set) return;
  for (const v of set) if (v.readyState === WebSocket.OPEN) v.send(buffer);
}
function listDevices() { return Object.keys(latestFrames); }

module.exports = { attach, getLatest, setLatest, forwardToViewers, listDevices };
