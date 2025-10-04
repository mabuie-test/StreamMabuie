// frontend/src/api.js
// Usa import.meta.env.VITE_API_BASE (definida no build)
// Exporta BASE e uma pequena wrapper `api` com helpers getJson/postJson etc.

const RAW_BASE = import.meta.env.VITE_API_BASE || '';
export const BASE = RAW_BASE.replace(/\/$/, ''); // remove slash final se existir

async function request(method, path, body, opts = {}) {
  // path deve começar com "/" (ex: "/auth/login" ou "/devices/list")
  const url = (BASE || '') + '/api' + path;
  const headers = Object.assign({'Content-Type': 'application/json'}, opts.headers || {});
  const fetchOpts = {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    credentials: opts.credentials || 'omit',
    mode: opts.mode || 'cors',
  };
  const res = await fetch(url, fetchOpts);
  return res;
}

export const api = {
  post: (path, body, opts) => request('POST', path, body, opts),
  get: (path, opts) => request('GET', path, null, opts),
  put: (path, body, opts) => request('PUT', path, body, opts),
  del: (path, opts) => request('DELETE', path, null, opts),

  // convenience that throws on non-OK
  postJson: async (path, body, opts) => {
    const r = await request('POST', path, body, opts);
    if (!r.ok) {
      const text = await r.text().catch(()=>null);
      throw new Error(`HTTP ${r.status} ${text || ''}`);
    }
    return r.json();
  },
  getJson: async (path, opts) => {
    const r = await request('GET', path, null, opts);
    if (!r.ok) {
      const text = await r.text().catch(()=>null);
      throw new Error(`HTTP ${r.status} ${text || ''}`);
    }
    return r.json();
  }
};
