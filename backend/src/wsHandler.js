/**
 * WebSocket handler:
 * - Camera connects: /ws?deviceId=ID&token=JWT (token optional)
 * - Viewer connects: /ws?viewerFor=ID&token=JWT (token required, must be owner)
 *
 * When camera sends binary frames we store latestFrames[deviceId] and forward to connected viewers.
 */
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
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', async (ws, req) => {
    const q = url.parse(req.url, true).query;

    // CAMERA
    if (q.deviceId) {
      let userId = null;
      if (q.token) {
        try { const p = jwtUtils.verify(q.token); userId = p.userId; } catch(e){ console.warn('camera token invalid'); }
      }
      const deviceId = q.deviceId;
      cameras.set(ws, { deviceId, userId });
      console.log('Camera connected', deviceId, 'owner=', userId || 'none');
      // upsert device
      try {
        const update = { lastSeen: new Date() };
        if (userId) update.owner = userId;
        await Device.findOneAndUpdate({ deviceId }, update, { upsert: true, setDefaultsOnInsert: true });
      } catch(e){ console.error('device upsert err', e); }

      ws.on('message', (msg) => {
        if (typeof msg === 'string') return; // ignore control text
        const buf = Buffer.from(msg);
        latestFrames[deviceId] = buf;
        const set = viewers[deviceId];
        if (set) {
          for (const v of set) {
            if (v.readyState === WebSocket.OPEN) {
              try { v.send(buf); } catch(_) {}
            }
          }
        }
      });

      ws.on('close', ()=> { cameras.delete(ws); console.log('camera disconnected', deviceId); });
      ws.on('error', ()=> { cameras.delete(ws); });
      return;
    }

    // VIEWER - must supply token and be owner
    if (q.viewerFor) {
      const deviceId = q.viewerFor;
      const token = q.token;
      if (!token) { try { ws.close(4001, 'no token'); } catch(_){}; return; }
      let payload;
      try { payload = jwtUtils.verify(token); } catch(e) { try { ws.close(4002, 'invalid token'); } catch(_){}; return; }
      // verify owner in DB
      try {
        const dev = await Device.findOne({ deviceId }).lean();
        if (!dev || !dev.owner || dev.owner.toString() !== payload.userId) {
          try { ws.close(4003, 'forbidden'); } catch(_) {}
          return;
        }
      } catch(e) { try { ws.close(4004, 'server error'); } catch(_){}; return; }

      viewers[deviceId] = viewers[deviceId] || new Set();
      viewers[deviceId].add(ws);
      console.log('Viewer connected for', deviceId, 'user=', payload.userId);
      if (latestFrames[deviceId]) {
        try { ws.send(latestFrames[deviceId]); } catch(_) {}
      }
      ws.on('close', ()=> { if (viewers[deviceId]) viewers[deviceId].delete(ws); });
      ws.on('error', ()=> { if (viewers[deviceId]) viewers[deviceId].delete(ws); });
      return;
    }

    // unknown
    ws.close();
  });

  console.log('WebSocket server attached at /ws');
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
