'use client';

import { useMemo } from 'react';

import { auth } from './auth';

// env bases
const AUTH = process.env.NEXT_PUBLIC_AUTH_URL!;
const VM = process.env.NEXT_PUBLIC_VM_URL!;

/** Build a tiny JSON fetch client */
function buildClient(base: string, getBearer?: () => string | undefined) {
  const baseUrl = base.replace(/\/+$/, '');

  async function request<T>(
    path: string,
    init?: RequestInit & { json?: unknown }
  ): Promise<T> {
    const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    };

    // attach bearer if available
    const tok = getBearer?.();
    if (tok) headers['authorization'] = `Bearer ${tok}`;

    const body =
      init?.json !== undefined
        ? JSON.stringify(init.json)
        : (init?.body as BodyInit | undefined);

    const res = await fetch(url, { ...init, headers, body });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const msg = (data && data.message) || `HTTP ${res.status}`;
      const err = new Error(msg) as Error & { status?: number; data?: unknown };
      (err as any).status = res.status;
      err.data = data;
      throw err;
    }
    return data as T;
  }

  return {
    get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
    post: <T>(path: string, json?: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'POST', json }),
    patch: <T>(path: string, json?: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'PATCH', json }),
    put: <T>(path: string, json?: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'PUT', json }),
    del: <T>(path: string, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'DELETE' }),
    baseUrl,
  };
}

/** Auth service (no bearer) */
export function useAuthApi() {
  return useMemo(() => buildClient(AUTH), []);
}

/** Vending-machine API with technician token (maintenance) */
export function useMaintenanceApi() {
  return useMemo(() => buildClient(VM, () => auth.technician), []);
}

/** Vending-machine API with machine token (machine operations) */
export function useMachineApi() {
  return useMemo(() => buildClient(VM, () => auth.machine), []);
}
