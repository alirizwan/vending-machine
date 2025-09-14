'use client';
import { useState } from 'react';

import { useAuthApi } from '@/lib/api-hooks';
import { useTechnicianAuth } from '@/lib/auth-state-hooks';

export default function Page() {
  const api = useAuthApi();
  const technician = useTechnicianAuth();

  const [username, setUser] = useState('');
  const [password, setPass] = useState('');
  const [msg, setMsg] = useState<string>();

  async function login() {
    setMsg(undefined);
    try {
      const { token } = await api.post<{ token: string }>(
        '/auth/technician/login',
        { username, password }
      );
      technician.set(token);
      setMsg('Technician logged in');
    } catch (e) {
      console.log(e)
      setMsg((e as Error).message);
    }
  }

  function logout() { 
    technician.clear();
    setMsg('Technician logged out');
  }


  return (
    <main>
      <h2>Technician Login</h2>
      <div style={{ display:'grid', gap:8, maxWidth:320 }}>
        {
          technician.loggedIn && !technician.expired
            ? <p style={{ color:'green' }}>Logged in as {technician.username} (token valid)</p>
            : technician.loggedIn && technician.expired
              ? <p style={{ color:'orange' }}>Logged in as {technician.username} (token expired)</p>
              : <p style={{ color:'red' }}>Not logged in</p>
        }
        {
          (!technician.loggedIn || technician.expired) ? (
            <><input value={username} onChange={e => setUser(e.target.value)} placeholder="username" /><input type="password" value={password} onChange={e => setPass(e.target.value)} placeholder="password" /><button onClick={login}>Login</button></>
          ) : null
        }
        <button onClick={logout}>Logout</button>
        {msg && <p>{msg}</p>}
      </div>
      <p style={{ marginTop: 12 }}>Next: go to <a href="/machine">/machine</a> to set machine API key.</p>
    </main>
  );
}
