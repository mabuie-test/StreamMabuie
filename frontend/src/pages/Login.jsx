import React, { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function login(){
    try {
      const res = await api.post('/auth/login', { email, password });
      if(res.ok){
        const j = await res.json();
        onLogin(j.token);
      } else {
        setMsg('Login falhou');
      }
    } catch(e){
      setMsg('Erro de rede');
    }
  }

  async function register(){
    try {
      const res = await api.post('/auth/register', { email, password });
      setMsg(res.ok ? 'Registado — faça login' : 'Falha no registo');
    } catch(e){
      setMsg('Erro de rede');
    }
  }

  return (
    <div className="max-w-md mx-auto mt-24 bg-white p-6 rounded shadow">
      <h2 className="text-xl mb-4">Login StealthCam</h2>
      <input className="w-full mb-2 p-2 border rounded" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full mb-2 p-2 border rounded" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <div className="flex gap-2">
        <button className="px-3 py-2 bg-sky-600 text-white rounded" onClick={login}>Login</button>
        <button className="px-3 py-2 bg-gray-200 rounded" onClick={register}>Register</button>
      </div>
      <div className="text-sm text-red-600 mt-2">{msg}</div>
    </div>
  );
}
