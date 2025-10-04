import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function App(){
  return (
    <div>
      <header style={{padding:10, borderBottom:'1px solid #ddd'}}>
        <h1 style={{display:'inline'}}>StealthCam Viewer</h1>
        <nav style={{float:'right'}}>
          <Link to="/devices" style={{marginRight:8}}>Devices</Link>
          <Link to="/login" style={{marginRight:8}}>Login</Link>
          <Link to="/register">Register</Link>
        </nav>
      </header>
      <main style={{padding:20}}>
        <Outlet />
      </main>
    </div>
  );
}
