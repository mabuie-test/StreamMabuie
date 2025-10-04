export const api = {
  post: async (path, body) => {
    const res = await fetch('/api' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res;
  },
  get: async (path) => {
    return fetch('/api' + path);
  }
};
