import { z } from 'zod';

export const AdjustOpSchema = z.enum(['set', 'increment', 'decrement']);

export const AdjustLineSchema = z.object({
  id: z.number().int().positive(),
  op: AdjustOpSchema,
  amount: z.number().nonnegative(), // 0 is allowed; reject negative
});

export const BulkAdjustSchema = z.object({
  changes: z.array(AdjustLineSchema).min(1),
});

export type AdjustOp = z.infer<typeof AdjustOpSchema>;
export type AdjustLine = z.infer<typeof AdjustLineSchema>;
export type BulkAdjustBody = z.infer<typeof BulkAdjustSchema>;
