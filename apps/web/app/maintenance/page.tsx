'use client';
import { useEffect, useState } from 'react';

import { useMaintenanceApi } from '@/lib/api-hooks';
import { useTechnicianAuth } from '@/lib/auth-state-hooks';
import type { Ingredient } from '@/lib/types';

type Change = { id: number; op: 'set'|'increment'|'decrement'; amount: number };

export default function MaintenancePage() {
  const api = useMaintenanceApi();
  const technician = useTechnicianAuth();

  const [items, setItems] = useState<Ingredient[]>([]);
  const [error, setError] = useState<string>();
  const [changes, setChanges] = useState<Record<number, Change>>({});

  async function load() {
    setError(undefined);
    if (!technician.loggedIn) {
      setError('Technician not logged in.');
    } else {
      api.get<Ingredient[]>('/ingredients').then(setItems).catch(err => setError(err.message));
    }
  }

  useEffect(() => { load(); }, []);

  function setChange(id: number, patch: Partial<Change>) {
    setChanges(prev => ({ ...prev, [id]: { id, op: prev[id]?.op ?? 'set', amount: prev[id]?.amount ?? 0, ...patch } }));
  }

  async function apply() {
    try {
      if (!technician.loggedIn) {
        alert('Technician not logged in.');
        return;
      }
      const payload = { changes: Object.values(changes).filter(c => c.amount >= 0) };
      if (payload.changes.length === 0) return;

      const result = await api.patch<Ingredient[]>('/ingredients', payload);
      
      setItems(result as Ingredient[]);
      setChanges({});
      alert('Stock updated');
    } catch (e) { setError((e as Error).message); }
  }

  if (!technician.loggedIn) {
    return <main><h2>Maintenance</h2><p style={{ color:'crimson' }}>Technician not logged in.</p></main>;
  }

  return (
    <main>
      <h2>Maintenance</h2>
      {error && <p style={{ color:'crimson' }}>{error}</p>}
      <button onClick={load}>Refresh</button>
      <table style={{ marginTop: 12, borderCollapse:'collapse' }}>
        <thead><tr><th align="left">Ingredient</th><th align="right">Stock</th><th>Op</th><th>Amount</th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td align="right">{item.stockUnits}</td>
              <td>
                <select value={changes[item.id]?.op ?? 'set'} onChange={e=>setChange(item.id, { op: e.target.value as Change['op'] })}>
                  <option value="set">set</option>
                  <option value="increment">increment</option>
                  <option value="decrement">decrement</option>
                </select>
              </td>
              <td>
                <input type="number" min={0} value={changes[item.id]?.amount ?? 0} onChange={e=>setChange(item.id, { amount: Number(e.target.value) })}/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <button onClick={apply}>Apply Changes</button>
      </div>
    </main>
  );
}
