/**
 * wsHandler.js — alterações:
 * - viewers exigem token via query string ?viewerFor=ID&token=JWT (fecha se inválido)
 * - cameras continuam a poder conectar com ?deviceId=ID&token=JWT (token opcional)
 * - não fazemos ownership check automático aqui (pode ser adicionado)
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
      wss.handleUpgrade(req, socket, head, (ws) => { wss.emit('connection', ws, req); });
    } else socket.destroy();
  });

  wss.on('connection', async (ws, req) => {
    const q = url.parse(req.url, true).query;

    // camera connects with deviceId & optional token
    if (q.deviceId) {
      let userId = null;
      try {
        if (q.token) {
          const payload = jwtUtils.verify(q.token);
          userId = payload.userId;
        }
      } catch(e) {
        // invalid token -> allow camera but no owner set
        console.warn('WS camera connected with invalid token (ignored)');
      }

      const dev = q.deviceId;
      cameras.set(ws, { deviceId: dev, userId });
      console.log('camera connected', dev, 'owner=', userId || 'none');

      // upsert device in DB and set owner if token present
      try {
        const update = { lastSeen: new Date() };
        if (userId) update.owner = userId;
        await Device.findOneAndUpdate({ deviceId: dev }, update, { upsert: true, setDefaultsOnInsert: true });
      } catch(e){ console.error('device upsert err', e); }

      ws.on('message', (msg) => {
        if (typeof msg === 'string') return; // ignore text messages
        const buf = Buffer.from(msg);
        latestFrames[dev] = buf;
        const set = viewers[dev];
        if (set) {
          for (const v of set) {
            if (v.readyState === WebSocket.OPEN) {
              try { v.send(buf); } catch(e) { /* ignore send errors */ }
            }
          }
        }
      });

      ws.on('close', ()=> { cameras.delete(ws); console.log('camera disconnected', dev); });
      ws.on('error', ()=> { cameras.delete(ws); });
    }

    // viewer connects with viewerFor and MUST provide token ?viewerFor=ID&token=JWT
    else if (q.viewerFor) {
      const dev = q.viewerFor;
      let token = q.token || null;
      // require token
      if (!token) {
        try { ws.close(4001, 'no token'); } catch(e) {}
        return;
      }
      try {
        const payload = jwtUtils.verify(token);
        // optional: check payload.userId matches owner in DB
        // if you want owner-only viewing, implement a DB check here
      } catch (e) {
        try { ws.close(4002, 'invalid token'); } catch(e2) {}
        return;
      }

      viewers[dev] = viewers[dev] || new Set();
      viewers[dev].add(ws);
      console.log('Authenticated viewer connected for', dev);
      // send last frame if exists
      if (latestFrames[dev]) {
        try { ws.send(latestFrames[dev]); } catch(e){}
      }
      ws.on('close', ()=> { if (viewers[dev]) viewers[dev].delete(ws); });
      ws.on('error', ()=> { if (viewers[dev]) viewers[dev].delete(ws); });
    }

    // unknown connection
    else {
      ws.close();
    }
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
