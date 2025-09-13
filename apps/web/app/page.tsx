'use client';
import { useState } from 'react';

import { jfetch, authBase } from '@/lib/api';
import { auth } from '@/lib/auth';

export default function Page() {
  const [username, setUser] = useState('tech');
  const [password, setPass] = useState('tech123');
  const [msg, setMsg] = useState<string>();

  async function login() {
    setMsg(undefined);
    try {
      const data = await jfetch<{ token: string }>(`${authBase()}/auth/technician/login`, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      auth.technician = data.token;
      setMsg('Technician logged in');
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  function logout() { 
    auth.clearTechnician(); 
    setMsg('Technician logged out');
  }


  return (
    <main>
      <h2>Technician Login</h2>
      <div style={{ display:'grid', gap:8, maxWidth:320 }}>
        <input value={username} onChange={e=>setUser(e.target.value)} placeholder="username" />
        <input type="password" value={password} onChange={e=>setPass(e.target.value)} placeholder="password" />
        <button onClick={login}>Login</button>
        <button onClick={logout}>Logout</button>
        {msg && <p>{msg}</p>}
      </div>
      <p style={{ marginTop: 12 }}>Next: go to <a href="/machine">/machine</a> to set machine API key.</p>
    </main>
  );
}
