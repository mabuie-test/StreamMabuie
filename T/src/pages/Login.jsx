import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "../api"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await login(email, password)
      if (res.token) {
        localStorage.setItem("token", res.token)
        localStorage.setItem("user", JSON.stringify(res.user)) // guarda user
        navigate("/dashboard")
      } else {
        alert(res.message || "Erro no login")
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-2xl shadow-lg w-80"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Entrar
        </button>
        <p className="text-sm mt-3 text-center">
          Não tens conta?{" "}
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => navigate("/register")}
          >
            Registar
          </span>
        </p>
      </form>
    </div>
  )
}
