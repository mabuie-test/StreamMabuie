const img = document.getElementById('img');
document.getElementById('mjpeg').onclick = ()=> {
  const dev = document.getElementById('device').value.trim();
  img.src = `/stream/${encodeURIComponent(dev)}`;
};
document.getElementById('ws').onclick = ()=> {
  const dev = document.getElementById('device').value.trim();
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws?viewerFor=${encodeURIComponent(dev)}`);
  ws.binaryType = 'arraybuffer';
  ws.onmessage = ev => {
    const blob = new Blob([ev.data], { type:'image/jpeg' });
    const url = URL.createObjectURL(blob);
    img.src = url;
    setTimeout(()=>URL.revokeObjectURL(url),500);
  };
};
