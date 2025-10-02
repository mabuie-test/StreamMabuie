// auth.js used by login.html
const btn = document.getElementById('btn');
const status = document.getElementById('status');
const msgEl = document.getElementById('msg');
const serverInput = document.getElementById('server');
const userInput = document.getElementById('user');
const passInput = document.getElementById('pass');
serverInput.value = localStorage.getItem('serverBase') || location.origin;

async function showMsg(text, isError=true){
  msgEl.style.display = 'block';
  msgEl.textContent = text;
  msgEl.style.background = isError ? 'linear-gradient(90deg, rgba(255,0,0,0.06), rgba(255,255,255,0.01))' : 'linear-gradient(90deg, rgba(6,182,212,0.06), rgba(255,255,255,0.01))';
}
async function doLogin(){
  msgEl.style.display='none'; status.textContent='...';
  const server = (serverInput.value||location.origin).replace(/\/+$/,'');
  const user = userInput.value.trim(); const pass = passInput.value.trim();
  if (!user || !pass) { showMsg('Preenche username e password'); status.textContent=''; return; }
  try {
    const res = await fetch(server + '/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:user,password:pass})});
    const text = await res.text(); let json=null; try{json=JSON.parse(text)}catch(e){}
    if (res.ok && json && json.token) {
      localStorage.setItem('token', json.token);
      localStorage.setItem('serverBase', server);
      status.textContent='OK';
      window.location.href = '/panel.html';
    } else {
      showMsg('Login falhou: ' + (json && json.error ? json.error : text));
      status.textContent='';
    }
  } catch (e) { showMsg('Erro rede: ' + e.message); status.textContent=''; }
}
btn.addEventListener('click', doLogin);
[serverInput,userInput,passInput].forEach(i=>i.addEventListener('keyup', (e)=>{ if (e.key==='Enter') doLogin(); }));
