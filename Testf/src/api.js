const BASE_URL = "https://streammabuie.onrender.com/api";

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function register(email, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getDevices(token) {
  const res = await fetch(`${BASE_URL}/devices`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
