const token = localStorage.getItem('token');
const serverBase = localStorage.getItem('serverBase') || location.origin;
if (!token) { location.href = '/login.html'; throw new Error('no token'); }
const grid = document.getElementById('grid');
document.getElementById('btnLogout').onclick = ()=> { localStorage.removeItem('token'); localStorage.removeItem('serverBase'); location.href='/login.html'; };
document.getElementById('btnRefresh').onclick = load;

async function load(){
  grid.innerHTML = '<div class="notice">A carregar...</div>';
  try {
    const res = await fetch(serverBase + '/api/devices', { headers: { 'Authorization': 'Bearer ' + token }});
    const j = await res.json();
    if (!j.ok) { grid.innerHTML = '<div class="notice">Erro: ' + JSON.stringify(j) + '</div>'; return; }
    grid.innerHTML = '';
    if (!j.devices.length) { grid.innerHTML = '<div class="notice">Nenhuma camera registada</div>'; return; }
    j.devices.forEach(d=>{
      const div = document.createElement('div'); div.className='card';
      const h = document.createElement('div'); h.className='card-title'; h.textContent = d.deviceId + (d.label ? ' - ' + d.label : '');
      const img = document.createElement('img'); img.className='thumb';
      img.src = serverBase + '/stream/' + encodeURIComponent(d.deviceId) + '?token=' + encodeURIComponent(token);
      img.addEventListener('click', ()=> window.open('/viewer.html?device=' + encodeURIComponent(d.deviceId), '_blank'));
      const meta = document.createElement('div'); meta.className='meta'; meta.textContent = 'Última: ' + new Date(d.lastSeen).toLocaleString() + ' | online: ' + d.online;
      div.appendChild(h); div.appendChild(img); div.appendChild(meta);
      grid.appendChild(div);
    });
  } catch(e) {
    grid.innerHTML = '<div class="notice">Erro: ' + e.message + '</div>';
  }
}
load();
