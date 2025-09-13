'use client';
import { useEffect, useState } from 'react';
import { jfetch, vmBase } from '@/lib/api';
import { auth } from '@/lib/auth';
import type { Ingredient } from '@/lib/types';

type Change = { id: number; op: 'set'|'increment'|'decrement'; amount: number };

export default function MaintenancePage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [error, setError] = useState<string>();
  const [changes, setChanges] = useState<Record<number, Change>>({});

  async function load() {
    setError(undefined);
    try {
      const token = auth.technician;
      if (!token) throw new Error('Technician not logged in.');
      const res = await fetch(`${vmBase()}/ingredients`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed');
      setItems(data as Ingredient[]);
    } catch (e) { setError((e as Error).message); }
  }

  useEffect(() => { void load(); }, []);

  function setChange(id: number, patch: Partial<Change>) {
    setChanges(prev => ({ ...prev, [id]: { id, op: prev[id]?.op ?? 'set', amount: prev[id]?.amount ?? 0, ...patch } }));
  }

  async function apply() {
    try {
      const token = auth.technician;
      if (!token) throw new Error('Technician not logged in.');
      const payload = { changes: Object.values(changes).filter(c => c.amount >= 0) };
      if (payload.changes.length === 0) return;

      const res = await fetch(`${vmBase()}/ingredients`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed');

      setItems(data as Ingredient[]);
      setChanges({});
      alert('Stock updated');
    } catch (e) { setError((e as Error).message); }
  }

  return (
    <main>
      <h2>Maintenance</h2>
      {error && <p style={{ color:'crimson' }}>{error}</p>}
      <button onClick={load}>Refresh</button>
      <table style={{ marginTop: 12, borderCollapse:'collapse' }}>
        <thead><tr><th align="left">Ingredient</th><th align="right">Stock</th><th>Op</th><th>Amount</th></tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td align="right">{i.stockUnits}</td>
              <td>
                <select value={changes[i.id]?.op ?? 'set'} onChange={e=>setChange(i.id, { op: e.target.value as Change['op'] })}>
                  <option value="set">set</option>
                  <option value="increment">increment</option>
                  <option value="decrement">decrement</option>
                </select>
              </td>
              <td>
                <input type="number" min={0} value={changes[i.id]?.amount ?? 0} onChange={e=>setChange(i.id, { amount: Number(e.target.value) })}/>
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
