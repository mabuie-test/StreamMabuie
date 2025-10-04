// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function login() {
    setMsg('A processar...');
    try {
      // usa api.postJson que lança em caso de status !== 2xx
      const j = await api.postJson('/api/auth/login', { email, password });
      if (j && j.token) {
        onLogin(j.token);
      } else {
        setMsg('Resposta inválida do servidor');
      }
    } catch (e) {
      console.error('Login error', e);
      setMsg('Login falhou — ver console para detalhes');
    }
  }

  async function register() {
    setMsg('A registar...');
    try {
      const res = await api.post('/auth/register', { email, password });
      if (res.ok) {
        setMsg('Registado — faça login');
      } else {
        const text = await res.text().catch(()=>null);
        setMsg('Registo falhou: ' + (text || res.status));
      }
    } catch (e) {
      console.error('Register error', e);
      setMsg('Erro de rede no registo');
    }
  }

  return (
    <div className="max-w-md mx-auto mt-24 bg-white p-6 rounded shadow">
      <h2 className="text-xl mb-4">Login StealthCam</h2>
      <input
        className="w-full mb-2 p-2 border rounded"
        placeholder="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        className="w-full mb-2 p-2 border rounded"
        placeholder="password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="px-3 py-2 bg-sky-600 text-white rounded"
          onClick={login}
        >
          Login
        </button>
        <button
          className="px-3 py-2 bg-gray-200 rounded"
          onClick={register}
        >
          Register
        </button>
      </div>
      <div className="text-sm text-red-600 mt-2">{msg}</div>
    </div>
  );
}
