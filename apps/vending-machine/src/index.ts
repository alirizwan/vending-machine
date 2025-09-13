import 'dotenv/config';
import cors from 'cors';
import express, { RequestHandler } from 'express';
import { ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import beveragesRoutes from './routes/beverages.js';
import ingredientsRoutes from './routes/ingredients.js';
import { envSchema, type Env } from './types/env.js';

const parsed: Env = envSchema.parse(process.env);

const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

const ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
app.use(cors({
  origin: ORIGIN,
  methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  maxAge: 600,
}));
app.options('*', cors());

app.get('/healthz', ((_, res) => {
  res.json({ ok: true, machineId: parsed.MACHINE_ID });
}) as RequestHandler);

app.use(beveragesRoutes());
app.use(ingredientsRoutes());

app.use(((err, _req, res, _next) => {
  const status: number = typeof (err as any)?.status === 'number' ? (err as any).status : 500;
  const message: string = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(status).json({ message });
}) as ErrorRequestHandler);

app.use(((req, res) => {
  res.status(404).json({ message: 'Not Found', path: req.path });
}) as RequestHandler);

app.listen(parsed.PORT, () => {
   
  console.log(`vending-machine listening on :${parsed.PORT}`);
});
