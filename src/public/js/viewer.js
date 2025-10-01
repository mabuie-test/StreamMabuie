const img = document.getElementById('img');
const deviceInput = document.getElementById('device');

document.getElementById('btnWs').onclick = () => {
  const dev = deviceInput.value.trim();
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws?viewerFor=${encodeURIComponent(dev)}`);
  ws.binaryType = 'arraybuffer';
  ws.onmessage = (ev) => {
    const blob = new Blob([ev.data], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    img.src = url;
    setTimeout(()=>URL.revokeObjectURL(url), 700);
  };
  ws.onopen = () => console.log('viewer ws open');
  ws.onclose = () => console.log('viewer ws closed');
};

document.getElementById('btnMjpeg').onclick = () => {
  const dev = deviceInput.value.trim();
  img.src = `/stream/${encodeURIComponent(dev)}`;
};
