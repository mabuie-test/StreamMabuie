const WebSocket = require('ws');
const url = require('url');
const jwtUtils = require('../utils/jwt');
const Device = require('../models/Device');

const latest = {};
const viewers = {};

function attach(server){
  const wss = new WebSocket.Server({ noServer: true });
  server.on('upgrade', (req, socket, head)=>{
    const p = url.parse(req.url, true);
    if(p.pathname === '/ws') wss.handleUpgrade(req, socket, head, ws=> wss.emit('connection', ws, req));
    else socket.destroy();
  });

  wss.on('connection', async (ws, req)=>{
    const q = url.parse(req.url, true).query;
    if(q.deviceId){
      let ownerId = null;
      if(q.token) {
        try { const p = jwtUtils.verify(q.token); ownerId = p.userId; } catch(e){}
      }
      const dev = q.deviceId;
      console.log('camera connected', dev, 'owner=', ownerId);
      try {
        const update = { lastSeen: new Date() };
        if (ownerId) update.owner = ownerId;
        await Device.findOneAndUpdate({ deviceId: dev }, update, { upsert: true, setDefaultsOnInsert: true });
      } catch(e){ console.error('device upsert err', e); }

      ws.on('message', msg=>{
        if(typeof msg === 'string') return;
        const b = Buffer.from(msg);
        if(b.length < 100) return;
        latest[dev] = b;
        const set = viewers[dev];
        if(set) for(const v of set) if(v.readyState===WebSocket.OPEN) v.send(b);
      });
      ws.on('close', ()=> console.log('camera disconnected', dev));
    } else if(q.viewerFor){
      const dev = q.viewerFor;
      viewers[dev] = viewers[dev] || new Set();
      viewers[dev].add(ws);
      if(latest[dev]) try{ ws.send(latest[dev]); }catch(e){}
      ws.on('close', ()=> viewers[dev].delete(ws));
    } else ws.close();
  });

  console.log('WS ready /ws');
}

function getLatest(deviceId){ return latest[deviceId]; }
function setLatest(deviceId, buf){ latest[deviceId]=buf; }
function forwardToViewers(deviceId, buf){ const set=viewers[deviceId]; if(!set) return; for(const v of set) if(v.readyState===WebSocket.OPEN) v.send(buf); }

module.exports = { attach, getLatest, setLatest, forwardToViewers };
