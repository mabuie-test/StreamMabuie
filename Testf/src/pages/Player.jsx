import React from 'react';
import { useParams } from 'react-router-dom';

export default function Player(){
  const { deviceId } = useParams();
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  const src = `${API_BASE}/api/stream/${deviceId}/mjpeg`;
  return (
    <div>
      <h2>Live — {deviceId}</h2>
      <div style={{width:640, height:480, background:'#000'}}>
        <img alt="live" src={src} style={{width:'100%', height:'100%', objectFit:'contain'}} />
      </div>
      <p>Se o stream estiver estático, garante que o device está a enviar frames e que a server URL está correta.</p>
    </div>
  );
}
