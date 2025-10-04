import React, { useEffect, useState } from 'react'
import { getDevices } from '../api'
import DeviceCard from '../components/DeviceCard'

export default function Dashboard() {
  const [devices, setDevices] = useState([])
  const token = localStorage.getItem('token')

  useEffect(() => {
    async function load() {
      const res = await getDevices(token)
      if (Array.isArray(res)) setDevices(res)
    }
    load()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h2>Dispositivos</h2>
      {devices.map(d => (
        <DeviceCard key={d._id} device={d} />
      ))}
    </div>
  )
}
