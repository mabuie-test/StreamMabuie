import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Link } from 'react-router-dom';

export default function Devices(){
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [name, setName] = useState('');
  const [err,setErr]=useState(null);

  useEffect(()=>{ load(); },[]);
  async function load(){
    try {
      const res = await apiFetch('/api/devices');
      setDevices(res.devices || []);
    } catch (e) { setErr(e.error || 'Error'); }
  }

  async function create(e){
    e.preventDefault();
    try {
      await apiFetch('/api/devices', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ deviceId, name })
      });
      setDeviceId(''); setName('');
      load();
    } catch (e) { setErr(e.error || 'Create failed'); }
  }

  return (
    <div>
      <h2>Devices</h2>
      <form onSubmit={create} style={{marginBottom:12}}>
        <input placeholder="Device ID (ex: CAM001)" value={deviceId} onChange={e=>setDeviceId(e.target.value)} />
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <button>Create</button>
      </form>
      {err && <div style={{color:'red'}}>{err}</div>}
      <ul>
        {devices.map(d => (
          <li key={d._id}>
            <strong>{d.deviceId}</strong> — {d.name || 'no name'} — <Link to={`/player/${d.deviceId}`}>Open</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
