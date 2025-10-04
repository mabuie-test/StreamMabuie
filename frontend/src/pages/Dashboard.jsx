// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { api, BASE } from '../api';

export default function Dashboard({ logout }) {
  const [devices, setDevices] = useState([]);
  const [media, setMedia] = useState([]);
  const [playerSrc, setPlayerSrc] = useState('');

  async function loadDevices() {
    try {
      const data = await api.getJson('/devices/list');
      setDevices(data);
    } catch (e) {
      console.error('loadDevices error', e);
    }
  }

  async function loadMedia() {
    try {
      const data = await api.getJson('/upload/list');
      setMedia(data);
    } catch (e) {
      console.error('loadMedia error', e);
    }
  }

  useEffect(() => {
    loadDevices();
    loadMedia();
  }, []);

  function playFile(filename) {
    // Se BASE estiver vazio (desenvolvimento via proxy), usa caminho relativo /uploads
    const baseUploads = BASE || '';
    setPlayerSrc(baseUploads + '/uploads/' + filename);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl">StealthCam</h1>
        <div>
          <button className="px-3 py-2 bg-gray-200 rounded mr-2" onClick={loadDevices}>Refresh Devices</button>
          <button className="px-3 py-2 bg-red-500 text-white rounded" onClick={logout}>Logout</button>
        </div>
      </header>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Devices</h3>
          <ul>
            {devices.map(d => <li key={d._id} className="py-1 border-b">{d.name || d.uuid}</li>)}
          </ul>
        </div>
        <div className="col-span-2 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Media</h3>
          <div className="space-y-2">
            {media.map(m =>
              <div key={m._id} className="flex items-center justify-between border-b py-2">
                <div>{m.filename}</div>
                <div>
                  <button className="px-2 py-1 bg-sky-600 text-white rounded" onClick={()=>playFile(m.filename)}>Play</button>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4">
            {playerSrc && <video src={playerSrc} controls className="w-full rounded" />}
          </div>
        </div>
      </div>
    </div>
  );
}
