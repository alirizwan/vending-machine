import { z } from 'zod';

export const CreatePaymentSchema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.enum(['EUR', 'USD']).default('EUR'),
  method: z.enum(['card', 'cash', 'mock']).default('mock'),
  description: z.string().max(200).optional(),
  machineId: z.string().min(1).optional()
});

export type CreatePaymentBody = z.infer<typeof CreatePaymentSchema>;
