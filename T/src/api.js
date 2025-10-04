const API_URL = import.meta.env.VITE_API_URL || '/api'

export async function login(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  return res.json()
}

export async function register(username, password) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  return res.json()
}

export async function getDevices(token) {
  const res = await fetch(`${API_URL}/devices`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return res.json()
}
