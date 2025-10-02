(function(){
  function $id(id){ return document.getElementById(id); }
  const img = $id('img');
  if(!img) {
    console.error('viewer.js: elemento #img não encontrado');
    return;
  }

  $id('mjpeg').addEventListener('click', () => {
    try {
      const dev = $id('device').value.trim();
      if(!dev) return alert('Introduz device id');
      img.src = `/stream/${encodeURIComponent(dev)}`;
      console.log('MJPEG play:', img.src);
    } catch(e) { console.error('mjpeg click err', e); }
  });

  $id('ws').addEventListener('click', () => {
    try {
      const dev = $id('device').value.trim();
      if(!dev) return alert('Introduz device id');

      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${proto}://${location.host}/ws?viewerFor=${encodeURIComponent(dev)}`;
      console.log('Connecting WS ->', url);

      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        console.log('WS opened');
      };
      ws.onclose = (ev) => {
        console.warn('WS closed', ev);
      };
      ws.onerror = (err) => {
        console.error('WS error', err);
        alert('Erro na ligação WS (ver console)');
      };

      ws.onmessage = ev => {
        try {
          const blob = new Blob([ev.data], { type:'image/jpeg' });
          const url = URL.createObjectURL(blob);
          img.src = url;
          // limpar objectURL depois de um curto período
          setTimeout(()=> URL.revokeObjectURL(url), 700);
        } catch(e) {
          console.error('onmessage err', e);
        }
      };
    } catch(e) {
      console.error('ws click err', e);
    }
  });

  // safety: show console hint
  console.log('viewer.js loaded');
})();
