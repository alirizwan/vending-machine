const AUTH = process.env.NEXT_PUBLIC_AUTH_URL!;
const PAYMENT = process.env.NEXT_PUBLIC_PAYMENT_URL!;
const VM = process.env.NEXT_PUBLIC_VM_URL!;

export function authBase() { return AUTH.replace(/\/+$/, ''); }
export function paymentBase() { return PAYMENT.replace(/\/+$/, ''); }
export function vmBase() { return VM.replace(/\/+$/, ''); }

export async function jfetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}
