'use client';
import { useState } from 'react';

import { useAuthApi } from '@/lib/api-hooks';
import { useMachineAuth } from '@/lib/auth-state-hooks';

export default function MachinePage() {
  const api = useAuthApi();
  const machine = useMachineAuth();

  const [machineId, setId] = useState('');
  const [apiKey, setKey] = useState('');
  const [msg, setMsg] = useState<string>();

  async function connect() {
    setMsg(undefined);
    try {
      const data = await api.post<{ token: string }>('/auth/machine/login', {
        machineId,
        apiKey,
      });
      machine.set(data.token);
      setMsg('Machine authorized successfully');
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  function disconnect() {
    machine.clear();
    setMsg('Machine cleared');
  }

  return (
    <main>
      <h2>Machine Authorization</h2>
      <div style={{ display:'grid', gap:8, maxWidth:360 }}>
        {
          machine.loggedIn && !machine.expired
            ? <p style={{ color:'green' }}>Connected as machine #{machine.machineId} (token valid)</p>
            : machine.loggedIn && machine.expired
              ? <p style={{ color:'orange' }}>Connected as machine #{machine.machineId} (token expired)</p>
              : <p style={{ color:'red' }}>Not connected</p>
        }
        {
          (!machine.loggedIn || machine.expired) ? (
            <>
              <input value={machineId} onChange={e=>setId(e.target.value)} placeholder="machineId" />
              <input value={apiKey} onChange={e=>setKey(e.target.value)} placeholder="apiKey" />
              <button onClick={connect}>Authorize</button>
            </>
          ) : null  
        }
        { machine.loggedIn && !machine.expired && <button onClick={disconnect}>Unauthorize</button> }
        {msg && <p>{msg}</p>}
      </div>
      <p style={{ marginTop: 12 }}>Next: visit <a href="/beverages">/beverages</a>.</p>
    </main>
  );
}
