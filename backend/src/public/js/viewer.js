// viewer.js reads ?device=ID and opens ws viewer (preferred) else mjpeg
const params = new URLSearchParams(location.search);
const device = params.get('device');
const token = localStorage.getItem('token');
const serverBase = localStorage.getItem('serverBase') || location.origin;
if (!token) { location.href = '/login.html'; throw new Error('no token'); }
if (!device) { document.getElementById('title').textContent = 'Device inválido'; throw new Error('no device'); }

document.getElementById('title').textContent = device;
document.getElementById('meta').textContent = 'Live: ' + device;

const preview = document.getElementById('preview');

// Try WS viewer first (wss if https). WS requires ?viewerFor=ID&token=JWT
(function openWS(){
  try {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    // serverBase may include http(s)://host:port - we need host only
    const host = (new URL(serverBase)).host;
    const ws = new WebSocket(`${proto}://${host}/ws?viewerFor=${encodeURIComponent(device)}&token=${encodeURIComponent(token)}`);
    ws.binaryType = 'arraybuffer';
    ws.onopen = ()=> console.log('ws viewer open');
    ws.onmessage = ev => {
      const blob = new Blob([ev.data], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      preview.src = url;
      setTimeout(()=>URL.revokeObjectURL(url), 600);
    };
    ws.onerror = (e) => {
      console.error('ws err', e);
      // fallback to MJPEG
      preview.src = serverBase + '/stream/' + encodeURIComponent(device) + '?token=' + encodeURIComponent(token);
    };
  } catch(e) {
    console.error('viewer ws open fail', e);
    preview.src = serverBase + '/stream/' + encodeURIComponent(device) + '?token=' + encodeURIComponent(token);
  }
})();
