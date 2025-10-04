import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

export default function Login(){
  const [email,setEmail]=useState('');
  const [pw,setPw]=useState('');
  const nav = useNavigate();
  const [err,setErr]=useState(null);
  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, password: pw })
      });
      localStorage.setItem('token', data.token);
      nav('/devices');
    } catch (e) { setErr(e.error || 'Login failed'); }
  };
  return (
    <div style={{maxWidth:400}}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:'block',width:'100%'}}/>
        <input placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} type="password" style={{display:'block',width:'100%'}}/>
        <button>Login</button>
      </form>
      {err && <div style={{color:'red'}}>{err}</div>}
    </div>
  );
}
