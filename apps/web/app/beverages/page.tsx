'use client';
import { useEffect, useState } from 'react';

import PrepareDialog, { type PrepareFormValues } from '@/components/prepare-dialog.client';
import { useMachineApi } from '@/lib/api-hooks';
import type { Beverage } from '@/lib/types';

export default function BeveragesPage() {
  const api = useMachineApi();

  const [items, setItems] = useState<Beverage[]>([]);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<number | null>(null);

  const [openId, setOpenId] = useState<number | null>(null);

  const load = async () => {
    try {
      const beverages = await api.get<Beverage[]>('/beverages');
      setItems(beverages);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const findBeverageById = (id: number) => items.find(b => b.id === id) || null;

  async function onConfirm(beverage: Beverage, values: PrepareFormValues) {
    setBusy(beverage.id);
    setError(undefined);
    try {
      await api.post(`/beverages/${beverage.id}/prepare`, values);

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
            <button disabled={!beverage.availability || busy === beverage.id} onClick={() => setOpenId(beverage.id)} style={{ marginTop:8 }}>
              {busy === beverage.id ? 'Preparing...' : 'Prepare'}
            </button>
          </li>
        ))}
      </ul>

      <PrepareDialog
        open={openId !== null}
        onClose={(refresh: boolean) => {
          if (refresh) load();
          setOpenId(null);
        }}
        beverage={findBeverageById(openId as number) as Beverage}
        defaultShots={1}
        defaultSugar={0}
      />

    </main>
  );
}
