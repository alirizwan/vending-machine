'use client';

import { useEffect, useMemo, useState } from 'react';

export interface BasePayload {
  sub: string;
  role: 'technician' | 'machine';
  iat?: number;
  exp?: number;
  username?: string;
  machineId?: string;
}

export interface CreateAuthHookOptions<TPayload extends BasePayload> {
  storageKey: string;
  decode: (token: string | undefined) => TPayload | undefined;
}

export const TECH_KEY = 'vm-tech-token';
export const MACHINE_KEY = 'vm-machine-token';

function decodeJwt<T extends object>(token: string | undefined): T | undefined {
  if (!token) return undefined;
  const parts = token.split('.');
  if (parts.length < 2) return undefined;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json =
      typeof window !== 'undefined'
        ? decodeURIComponent(
            atob(b64)
              .split('')
              .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
              .join('')
          )
        : Buffer.from(b64, 'base64').toString('utf-8');
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
}

function isExpired(exp?: number): boolean {
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now;
}

export function safeGet(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(key) ?? undefined;
}

function safeSet(key: string, val: string | undefined): void {
  if (typeof window === 'undefined') return;
  if (!val) localStorage.removeItem(key);
  else localStorage.setItem(key, val);
}

export function createAuthHook<TPayload extends BasePayload>({
  storageKey,
  decode,
}: CreateAuthHookOptions<TPayload>) {
  return function useAuthState() {
    const [token, setToken] = useState<string | undefined>(() => safeGet(storageKey));
    const payload = useMemo(() => decode(token), [token]);
    const expired = isExpired(payload?.exp);

    useEffect(() => {
      const onStorage = (e: StorageEvent) => {
        if (e.key === storageKey) setToken(safeGet(storageKey));
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }, [storageKey]);

    return {
      token,
      payload,
      loggedIn: Boolean(token) && !expired,
      username: payload?.username,
      machineId: payload?.machineId,
      expired,
      exp: payload?.exp,
      set: (t: string) => {
        safeSet(storageKey, t);
        setToken(t);
      },
      clear: () => {
        safeSet(storageKey, undefined);
        setToken(undefined);
      },
    };
  };
}

export type TechnicianPayload = BasePayload & {
  role: 'technician';
  username: string;
};

export type MachinePayload = BasePayload & {
  role: 'machine';
  machineId: string;
};

export const useTechnicianAuth = createAuthHook<TechnicianPayload>({
  storageKey: TECH_KEY,
  decode: (t) => decodeJwt<TechnicianPayload>(t),
});

export const useMachineAuth = createAuthHook<MachinePayload>({
  storageKey: MACHINE_KEY,
  decode: (t) => decodeJwt<MachinePayload>(t),
});
