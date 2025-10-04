import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../api'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    const res = await register(username, password)
    if (res.success) {
      alert('Registrado com sucesso!')
      navigate('/login')
    } else {
      alert(res.message || 'Erro no registo')
    }
  }

  return (
    <form onSubmit={handleRegister} style={{ padding: 20 }}>
      <h2>Registo</h2>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuário" />
      <br />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" />
      <br />
      <button type="submit">Registrar</button>
    </form>
  )
}
