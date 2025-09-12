import 'dotenv/config';
import express, { RequestHandler } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { envSchema, type Env } from './types/env.js';
import beveragesRoutes from './routes/beverages.js';
//import { ingredientsRouter } from './routes/ingredients.js';
import { ErrorRequestHandler } from 'express';

const parsed: Env = envSchema.parse(process.env);

const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.get('/healthz', ((_, res) => {
  res.json({ ok: true, machineId: parsed.MACHINE_ID });
}) as RequestHandler);

app.use(beveragesRoutes());
//app.use(ingredientsRouter);
/*
app.use(((err, _req, res, _next) => {
  const status: number = typeof (err as any)?.status === 'number' ? (err as any).status : 500;
  const message: string = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(status).json({ message });
}) as ErrorRequestHandler);*/

app.use(((req, res) => {
  res.status(404).json({ message: 'Not Found', path: req.path });
}) as RequestHandler);

app.listen(parsed.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`vending-machine listening on :${parsed.PORT}`);
});
