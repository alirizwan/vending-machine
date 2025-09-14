'use client';
import { useState, useRef } from 'react';

import { useMachineApi } from '@/lib/api-hooks';
import type { Beverage } from '@/lib/types';

export type PrepareFormValues = {
  shots: number;
  sugar: number;
  paymentId: string;
};

type Phase = 'idle' | 'awaiting_payment' | 'failed' | 'preparing' | 'done';

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
      setPhase('failed');
      setStatusMsg('Process failed. Please try again.');
      setError((e as Error).message);
    }
  }

  function close() {
    setPhase('idle');
    setStatusMsg('');
    setError('');
    onClose(false);
  }

  const customizableOptions = beverage.recipe.filter(r => ['espresso', 'sugar'].includes(r.ingredient.toLowerCase()));
  const optionsMap = Object.fromEntries(customizableOptions.map(o => [o.ingredient.toLowerCase(), o]));

  if (!customizableOptions.length) {
    prepare({ shots: 0, sugar: 0, paymentId: 'dummy-payment-id' });
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
                phase === 'failed' ? '#ffe6e6' :
                phase === 'done' ? '#e7f8ec' :
                '#eef3ff',
              color:
                phase === 'failed' ? '#b41414' :
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
              {phase === 'failed' && '❌'}
              {phase === 'done' && '✅'}
            </span>
            <span>{statusMsg}</span>
          </div>
        )}

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        {
          ['idle', 'failed'].includes(phase) && customizableOptions.length > 0 && (
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
                <input name="shots" type="number" min={1} max={5} defaultValue={optionsMap['espresso']?.quantity} />
              </label>
              <label>
                Sugar (grams):
                <input name="sugar" type="number" min={0} max={5} defaultValue={optionsMap['sugar']?.quantity || 0} />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={close}>Cancel</button>
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
