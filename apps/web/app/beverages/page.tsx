'use client';
import { useEffect, useState } from 'react';
import { jfetch, vmBase } from '@/lib/api';
import { auth } from '@/lib/auth';
import type { Beverage } from '@/lib/types';

type Line = { ingredient: string; quantity: number; unit: string };

export default function BeveragesPage() {
  const [items, setItems] = useState<Beverage[]>([]);
  const [error, setError] = useState<string>();
  const [sugar, setSugar] = useState<number>(0);   // grams
  const [shots, setShots] = useState<number>(1);   // espresso shots
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setItems(await jfetch<Beverage[]>(`${vmBase()}/beverages`));
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  async function prepare(b: Beverage) {
    setBusy(b.id);
    setError(undefined);
    try {
      // Optionally tweak recipe client-side: adjust shots & sugar
      const hasEspresso = b.recipe.find(r => r.ingredient === 'espresso');
      const recipeOverride: Line[] = [];

      if (hasEspresso) {
        recipeOverride.push({ ingredient: 'espresso', quantity: shots, unit: 'shot' });
      }
      if (sugar > 0) {
        recipeOverride.push({ ingredient: 'sugar', quantity: sugar, unit: 'gram' });
      }

      // Normally you'd POST a custom prepare route that accepts overrides.
      // For the demo, call /prepare and rely on server-side recipe.
      // If you implement overrides server-side, send them in body here.
      const token = auth.machine;
      if (!token) throw new Error('Machine not authorized. Go to /machine first.');

      // charge first (optional demo)
      // await jfetch(`${paymentBase()}/payments`, { method:'POST', body: JSON.stringify({ amountCents: b.price, machineId: 'vm-001' }) });

      const res = await fetch(`${vmBase()}/beverages/${b.id}/prepare`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);

      alert(`Prepared: ${b.name}`);
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
        {items.map(b => (
          <li key={b.id} style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <strong>{b.name}</strong>
              <span>{(b.price/100).toFixed(2)} €</span>
            </div>
            <div style={{ fontSize:13, color:'#555' }}>
              {b.recipe.map(r => `${r.ingredient} (${r.quantity} ${r.unit})`).join(', ')}
            </div>
            {!b.available && (
              <div style={{ color:'crimson', fontSize:12, marginTop:6 }}>
                Unavailable. Shortages: {b.shortages.map(s => `${s.ingredient} +${s.required - s.available}${s.unit}`).join(', ')}
              </div>
            )}
            <button disabled={!b.available || busy === b.id} onClick={() => prepare(b)} style={{ marginTop:8 }}>
              {busy === b.id ? 'Preparing...' : 'Prepare'}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
