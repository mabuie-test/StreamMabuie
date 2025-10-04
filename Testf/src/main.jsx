import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Register from './pages/Register';
import Devices from './pages/Devices';
import Player from './pages/Player';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Navigate to="/devices" />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="devices" element={<Devices />} />
        <Route path="player/:deviceId" element={<Player />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
