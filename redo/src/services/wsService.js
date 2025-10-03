
/*
  Simple WebSocket service that stores latest frames in memory and forwards frames
  to viewers. Attach to a created HTTP server:
    const ws = require('./services/wsService');
    ws.attach(server);
*/
const WebSocket = require('ws');
const url = require('url');
const Device = require('../models/Device');
const jwt = require('../utils/jwt');

const latest = {};
const viewers = {};

function attach(server) {
  const wss = new WebSocket.Server({ noServer: true });
  server.on('upgrade', (req, socket, head) => {
    const parsed = url.parse(req.url, true);
    if (parsed.pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
    } else socket.destroy();
  });

  wss.on('connection', async (ws, req) => {
    const q = url.parse(req.url, true).query;
    if (q.deviceId) {
      const devId = q.deviceId;
      // try set owner if token provided
      if (q.token) {
        try {
          const pl = jwt.verify(q.token);
          await Device.findOneAndUpdate({ deviceId: devId }, { owner: pl.userId, lastSeen: new Date() }, { upsert:true, setDefaultsOnInsert:true });
        } catch(e){}
      } else {
        try { await Device.findOneAndUpdate({ deviceId: devId }, { lastSeen: new Date() }, { upsert:true, setDefaultsOnInsert:true }); } catch(e){}
      }

      ws.on('message', msg => {
        if (typeof msg === 'string') return;
        const buf = Buffer.from(msg);
        latest[devId] = buf;
        const set = viewers[devId];
        if (set) for (const v of set) if (v.readyState === WebSocket.OPEN) v.send(buf);
      });
      ws.on('close', ()=>{});
      ws.on('error', ()=>{});
    } else if (q.viewerFor) {
      const dev = q.viewerFor;
      viewers[dev] = viewers[dev] || new Set();
      viewers[dev].add(ws);
      if (latest[dev]) {
        try { ws.send(latest[dev]); } catch(e){}
      }
      ws.on('close', ()=> viewers[dev].delete(ws));
      ws.on('error', ()=> viewers[dev].delete(ws));
    } else {
      ws.close();
    }
  });

  console.log('wsService attached');
}

function getLatest(deviceId){ return latest[deviceId]; }
function setLatest(deviceId, buf){ latest[deviceId]=buf; }
function forward(deviceId, buf){ const set = viewers[deviceId]; if (!set) return; for (const v of set) if (v.readyState===WebSocket.OPEN) v.send(buf); }

module.exports = { attach, getLatest, setLatest, forward };
