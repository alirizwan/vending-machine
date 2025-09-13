'use client';
import { useState } from 'react';

import { jfetch, authBase } from '@/lib/api';
import { auth } from '@/lib/auth';

export default function MachinePage() {
  const [machineId, setId] = useState('vm-001');
  const [apiKey, setKey] = useState('vm-001-DEV-KEY');
  const [msg, setMsg] = useState<string>();

  async function connect() {
    setMsg(undefined);
    try {
      const data = await jfetch<{ token: string }>(`${authBase()}/auth/machine/login`, {
        method: 'POST',
        body: JSON.stringify({ machineId, apiKey }),
      });
      auth.machine = data.token;
      setMsg('Machine authorized ✅');
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  function disconnect() { 
    auth.clearMachine(); 
    setMsg('Machine cleared'); 
  }

  return (
    <main>
      <h2>Machine Authorization</h2>
      <div style={{ display:'grid', gap:8, maxWidth:360 }}>
        <input value={machineId} onChange={e=>setId(e.target.value)} placeholder="machineId" />
        <input value={apiKey} onChange={e=>setKey(e.target.value)} placeholder="apiKey" />
        <button onClick={connect}>Authorize</button>
        <button onClick={disconnect}>Clear</button>
        {msg && <p>{msg}</p>}
      </div>
      <p style={{ marginTop: 12 }}>Next: visit <a href="/beverages">/beverages</a>.</p>
    </main>
  );
}
