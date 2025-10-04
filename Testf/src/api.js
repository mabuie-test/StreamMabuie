const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('token');
  opts.headers = opts.headers || {};
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(()=>({error: res.statusText}));
    throw err;
  }
  return res.json().catch(()=>null);
}
