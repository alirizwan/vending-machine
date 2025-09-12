export type PaymentStatus = 'succeeded' | 'declined';

export interface Payment {
  id: string;
  amountCents: number;
  currency: 'EUR' | 'USD';
  method: 'card' | 'cash' | 'mock';
  description?: string;
  machineId?: string;
  status: PaymentStatus;
  createdAt: string; // ISO
}
