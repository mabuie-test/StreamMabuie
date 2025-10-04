const RAW_BASE = import.meta.env.VITE_API_BASE || 'https://streammabuie.onrender.com';
export const BASE = RAW_BASE.replace(/\/$/, ''); // remove trailing slash

async function request(method, path, body, opts = {}) {
  const url = BASE + '/api' + path;
  const headers = Object.assign({'Content-Type': 'application/json'}, opts.headers || {});
  if(opts.token) headers['Authorization'] = 'Bearer ' + opts.token;
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
