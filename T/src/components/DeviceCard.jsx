import React, { useState } from 'react'

export default function DeviceCard({ device }) {
  const [show, setShow] = useState(false)

  return (
    <div style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
      <h3>{device.name}</h3>
      <button onClick={() => setShow(!show)}>
        {show ? 'Fechar vídeo' : 'Abrir vídeo'}
      </button>
      {show && (
        <div>
          <img
            src={device.streamUrl}
            alt="stream"
            style={{ width: '480px', border: '1px solid black', marginTop: 10 }}
          />
        </div>
      )}
    </div>
  )
}
