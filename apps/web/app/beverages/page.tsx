'use client';
import { useEffect, useState } from 'react';

import { useMachineApi } from '@/lib/api-hooks';
import type { Beverage } from '@/lib/types';

export default function BeveragesPage() {
  const api = useMachineApi();
  const [items, setItems] = useState<Beverage[]>([]);
  const [error, setError] = useState<string>();
  const [sugar, setSugar] = useState<number>(0);   // grams
  const [shots, setShots] = useState<number>(1);   // espresso shots
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    api.get<Beverage[]>('/beverages').then(setItems).catch(console.error);
  }, []);

  async function prepare(beverage: Beverage) {
    setBusy(beverage.id);
    setError(undefined);
    try {
      await api.post(`/beverages/${beverage.id}/prepare`);

      alert(`Prepared: ${beverage.name}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main>
      <h2>Beverages</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Shots: <input type="number" value={shots} min={1} max={4} onChange={e=>setShots(Number(e.target.value))} /></label>{' '}
        <label>Sugar (g): <input type="number" value={sugar} min={0} max={20} onChange={e=>setSugar(Number(e.target.value))} /></label>
      </div>
      {error && <p style={{ color:'crimson' }}>{error}</p>}
      <ul style={{ display:'grid', gap:12, listStyle:'none', padding:0 }}>
        {items.map(beverage => (
          <li key={beverage.id} style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <strong>{beverage.name}</strong>
              <span>{(beverage.price/100).toFixed(2)} €</span>
            </div>
            <div style={{ fontSize:13, color:'#555' }}>
              {beverage.recipe.map(r => `${r.ingredient} (${r.quantity} ${r.unit})`).join(', ')}
            </div>
            {!beverage.availability && (
              <div style={{ color:'crimson', fontSize:12, marginTop:6 }}>
                Unavailable. Shortages: {beverage.shortages.map(s => `${s.ingredient} +${s.required - s.available}${s.unit}`).join(', ')}
              </div>
            )}
            <button disabled={!beverage.availability || busy === beverage.id} onClick={() => prepare(beverage)} style={{ marginTop:8 }}>
              {busy === beverage.id ? 'Preparing...' : 'Prepare'}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
