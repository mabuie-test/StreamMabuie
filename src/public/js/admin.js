const listEl = document.getElementById('list');
const live = document.getElementById('live');
document.getElementById('btnRefresh').onclick = fetchDevices;

async function fetchDevices(){
  const res = await fetch('/api/devices');
  const j = await res.json();
  listEl.innerHTML = '';
  if (j.devices && j.devices.length){
    j.devices.forEach(d => {
      const li = document.createElement('li');
      li.textContent = d;
      const btn = document.createElement('button');
      btn.textContent = 'Ver (MJPEG)';
      btn.onclick = ()=> { live.src = `/stream/${encodeURIComponent(d)}`; };
      const btn2 = document.createElement('button');
      btn2.textContent = 'Ver (WS)';
      btn2.onclick = ()=> openWSViewer(d);
      li.appendChild(btn);
      li.appendChild(btn2);
      listEl.appendChild(li);
    });
  } else {
    listEl.textContent = 'Nenhum dispositivo activo';
  }
}

function openWSViewer(dev){
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws?viewerFor=${encodeURIComponent(dev)}`);
  ws.binaryType = 'arraybuffer';
  ws.onmessage = (ev) => {
    const blob = new Blob([ev.data], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    live.src = url;
    setTimeout(()=>URL.revokeObjectURL(url),500);
  };
}
