import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    const res = await login(username, password)
    if (res.token) {
      localStorage.setItem('token', res.token)
      navigate('/dashboard')
    } else {
      alert(res.message || 'Erro no login')
    }
  }

  return (
    <form onSubmit={handleLogin} style={{ padding: 20 }}>
      <h2>Login</h2>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuário" />
      <br />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" />
      <br />
      <button type="submit">Entrar</button>
    </form>
  )
}
