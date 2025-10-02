const token = localStorage.getItem('token');
if (!token) location.href = '/login.html';
document.getElementById('btnLogout').onclick = ()=> { localStorage.removeItem('token'); location.href='/login.html'; };

async function load(){
  const res = await fetch('/api/devices', { headers: { 'Authorization': 'Bearer ' + token }});
  const j = await res.json();
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  if (!j.ok || !j.devices) { grid.textContent = 'Erro: ' + JSON.stringify(j); return; }
  j.devices.forEach(d => {
    const div = document.createElement('div'); div.className = 'card';
    const h = document.createElement('h4'); h.textContent = d.deviceId + (d.label ? ' - ' + d.label : '');
    const img = document.createElement('img'); img.className = 'thumb';
    img.src = `/stream/${encodeURIComponent(d.deviceId)}`;
    const meta = document.createElement('div'); meta.textContent = `lastSeen: ${new Date(d.lastSeen).toLocaleString()} | online: ${d.online}`;
    div.appendChild(h); div.appendChild(img); div.appendChild(meta);
    grid.appendChild(div);
  });
}
load();
