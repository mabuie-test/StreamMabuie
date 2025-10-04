import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <div>
      <header style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <nav>
          <Link to="/login">Login</Link> |{" "}
          <Link to="/register">Registo</Link> |{" "}
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  )
}
