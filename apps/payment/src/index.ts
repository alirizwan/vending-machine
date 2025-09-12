import 'dotenv/config';
import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { CreatePaymentSchema, type CreatePaymentBody } from './schemas.js';
import type { Payment } from './types.js';

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT ?? 7002);

/**
 * In-memory idempotency store:
 *  - Key: idempotency key (header)
 *  - Value: previously created Payment
 * This is only for demo purposes.
 */
const IDEMPOTENT: Map<string, Payment> = new Map();

/** Health */
app.get('/healthz', ((_req, res) => res.json({ ok: true })) as RequestHandler);

/**
 * POST /payments
 * Body: { amountCents, currency?, method?, description?, machineId? }
 * Headers:
 *  - Idempotency-Key: optional string; same request with same key returns same response
 * Query:
 *  - simulate=decline   -> force a decline to demo unhappy paths
 */
const createPayment: RequestHandler = (req, res) => {
  // Idempotency handling
  const idemKey = req.header('Idempotency-Key') ?? req.header('idempotency-key') ?? undefined;
  if (idemKey && IDEMPOTENT.has(idemKey)) {
    res.status(200).json(IDEMPOTENT.get(idemKey));
    return;
  }

  const parsed = CreatePaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const body: CreatePaymentBody = parsed.data;

  // Simulate declines for demos
  const forceDecline = String(req.query.simulate ?? '') === 'decline';
  const status = forceDecline ? 'declined' : 'succeeded';

  const payment: Payment = {
    id: randomUUID(),
    amountCents: body.amountCents,
    currency: body.currency,
    method: body.method,
    description: body.description,
    machineId: body.machineId,
    status,
    createdAt: new Date().toISOString(),
  };

  if (idemKey) IDEMPOTENT.set(idemKey, payment);

  res.status(forceDecline ? 402 : 201).json(payment);
};

app.post('/payments', createPayment);

// Minimal error handler
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = (err as { status?: number }).status ?? 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(status).json({ message });
};
app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`mock payment listening on :${PORT}`);
});
