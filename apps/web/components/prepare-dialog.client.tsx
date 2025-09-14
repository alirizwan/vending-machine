'use client';
import { useEffect, useState, useRef } from 'react';

import { useMachineApi } from '@/lib/api-hooks';
import type { Beverage } from '@/lib/types';
import { on } from 'events';

export type PrepareFormValues = {
  shots: number;
  sugar: number;
  paymentId: string;
};

type Phase = 'idle' | 'awaiting_payment' | 'payment_failed' | 'preparing' | 'done';

type Props = {
  open: boolean;
  onClose: (refresh: boolean) => void;
  defaultShots?: number;
  defaultSugar?: number;
  beverage: Beverage;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function PrepareDialog({
  open,
  onClose,
  defaultShots = 1,
  defaultSugar = 0,
  beverage
}: Props) {

  const api = useMachineApi();
  const [phase, setPhase] = useState<Phase>('idle');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [error, setError] = useState<string>('');

  async function prepare(values: PrepareFormValues) {
    setError('');
    try {
      setPhase('awaiting_payment');
      setStatusMsg('Please pay on the terminal next to the machine…');
      await sleep(5000);

      setPhase('preparing');
      setStatusMsg(`Preparing ${beverage.name}… warming up and brewing`);

      await api.post(`/beverages/${beverage.id}/prepare`, values);
      await sleep(5000);

      setPhase('done');
      setStatusMsg(`${beverage.name} is ready. Enjoy!`);

      await sleep(3000);
      setPhase('idle');
      setStatusMsg('');
      onClose(true);
    } catch (e) {
      setPhase('payment_failed');
      setStatusMsg('Payment failed. Please try again.');
      setError((e as Error).message);
    }
  }

  const formRef = useRef<HTMLFormElement>(null);

  if (!open) return null;

  return (
    <div style={overlay}>
      <div style={dialog}>
        <h3 style={{ marginTop: 0 }}>{beverage.name}</h3>

        {phase !== 'idle' && (
          <div
            style={{
              margin: '8px 0 12px',
              padding: '10px 12px',
              borderRadius: 8,
              background:
                phase === 'payment_failed' ? '#ffe6e6' :
                phase === 'done' ? '#e7f8ec' :
                '#eef3ff',
              color:
                phase === 'payment_failed' ? '#b41414' :
                phase === 'done' ? '#116635' :
                '#1d3a8a',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <span>
              {phase === 'awaiting_payment' && '💳'}
              {phase === 'preparing' && '🛠️'}
              {phase === 'payment_failed' && '❌'}
              {phase === 'done' && '✅'}
            </span>
            <span>{statusMsg}</span>
          </div>
        )}

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        {
          ['idle', 'payment_failed'].includes(phase) && (
            <form
              ref={formRef}
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const shots = Number(fd.get('shots'));
                const sugar = Number(fd.get('sugar'));
                prepare({ shots, sugar, paymentId: 'dummy-payment-id' });
              }}
              style={{ display: 'grid', gap: 10 }}
            >
              <label>
                Espresso shots:
                <input name="shots" type="number" min={1} max={4} defaultValue={defaultShots} />
              </label>
              <label>
                Sugar (grams):
                <input name="sugar" type="number" min={0} max={20} defaultValue={defaultSugar} />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => onClose(false)}>Cancel</button>
                <button type="submit">Pay & Prepare</button>
              </div>
            </form>
          )
        }
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
  display: 'grid', placeItems: 'center', zIndex: 1000,
};

const dialog: React.CSSProperties = {
  width: 360, background: 'white', color: '#111', borderRadius: 12,
  padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
};
