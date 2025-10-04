import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('sc_token') || null);
  return token
    ? <Dashboard logout={() => { localStorage.removeItem('sc_token'); setToken(null); }} token={token} />
    : <Login onLogin={(t) => { localStorage.setItem('sc_token', t); setToken(t); }} />;
}
