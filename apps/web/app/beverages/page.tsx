'use client';
import { useEffect, useState } from 'react';

import PrepareDialog from '@/components/prepare-dialog.client';
import { useMachineApi } from '@/lib/api-hooks';
import { useMachineAuth } from '@/lib/auth-state-hooks';
import type { Beverage } from '@/lib/types';

export default function BeveragesPage() {
  const api = useMachineApi();
  const machine = useMachineAuth();

  const [items, setItems] = useState<Beverage[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState<string>();

  const load = async () => {
    setError(undefined);
    if (!machine.loggedIn) {
      setError('Machine is not authorized.');
      return;
    }
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
            <button disabled={!beverage.availability } onClick={() => setOpenId(beverage.id)} style={{ marginTop:8 }}>Prepare</button>
          </li>
        ))}
      </ul>
      
      {
        findBeverageById(openId as number) && (
          <PrepareDialog
            open={openId !== null}
            onClose={(refresh: boolean) => {
              if (refresh) load();
              setOpenId(null);
            }}
            beverage={findBeverageById(openId as number) as Beverage}
          />
        )
      }

    </main>
  );
}
