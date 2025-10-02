// viewer.js — envia token (localStorage) para MJPEG e WS viewers
const img = document.getElementById('img');

function getToken() {
  return localStorage.getItem('token') || null;
}

document.getElementById('mjpeg').onclick = ()=> {
  const dev = document.getElementById('device').value.trim();
  const token = getToken();
  if (!token) { alert('Por favor faça login primeiro'); location.href = '/login.html'; return; }
  // token na query (atenção: token aparece na URL/histórico — tradeoff simples)
  img.src = `/stream/${encodeURIComponent(dev)}?token=${encodeURIComponent(token)}`;
};

document.getElementById('ws').onclick = ()=> {
  const dev = document.getElementById('device').value.trim();
  const token = getToken();
  if (!token) { alert('Por favor faça login primeiro'); location.href = '/login.html'; return; }
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws?viewerFor=${encodeURIComponent(dev)}&token=${encodeURIComponent(token)}`);
  ws.binaryType = 'arraybuffer';
  ws.onmessage = ev => {
    const blob = new Blob([ev.data], { type:'image/jpeg' });
    const url = URL.createObjectURL(blob);
    img.src = url;
    setTimeout(()=>URL.revokeObjectURL(url),500);
  };
  ws.onopen = () => console.log('ws viewer open');
  ws.onerror = (e) => { console.error('ws viewer err', e); alert('Erro WS - ver console'); };
};
