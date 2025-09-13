import 'dotenv/config';
import cors from 'cors';
import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import { LoginSchema, type LoginBody, MachineLoginSchema, type MachineLoginBody } from './schemas.js';
import type { TechnicianTokenPayload, MachineTokenPayload, Technician, Machine } from './types.js';

const app = express();
app.use(express.json());

const ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
app.use(cors({
  origin: ORIGIN,
  methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  maxAge: 600,
}));
app.options('*', cors());

const PORT = Number(process.env.PORT ?? 7001);
const JWT_SECRET = process.env.JWT_SECRET ?? '';
if (JWT_SECRET.length < 16) {
   
  console.error('JWT_SECRET must be set and at least 16 chars for the mock auth service.');
  process.exit(1);
}

const TECHNICIANS: Technician[] = [
  { id: 1, username: 'tech',  password: 'tech123' },
  { id: 2, username: 'maria', password: 'maria123' },
];

const MACHINES: Machine[] = [
  { id: 1, name: 'Lobby machine',  machineId: 'vm-001', apiKey: 'vm-001-DEV-KEY' },
  { id: 2, name: 'Hallway machine', machineId: 'vm-002', apiKey: 'vm-002-DEV-KEY' },
];

app.get('/healthz', ((_req, res) => res.json({ ok: true })) as RequestHandler);

const technicianLogin: RequestHandler = (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const body: LoginBody = parsed.data;
  const user = TECHNICIANS.find(t => t.username === body.username && t.password === body.password);
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  const payload: TechnicianTokenPayload = {
    sub: String(user.id),
    role: 'technician',
    username: user.username,
  };
  const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
  res.status(200).json({ token });
};

/** Machine login: apiKey -> JWT (role=machine) */
const machineLogin: RequestHandler = (req, res) => {
  const parsed = MachineLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const body: MachineLoginBody = parsed.data;
  const m = MACHINES.find(x => x.machineId === body.machineId && x.apiKey === body.apiKey);
  if (!m) {
    res.status(401).json({ message: 'Invalid machineId or apiKey' });
    return;
  }
  const payload: MachineTokenPayload = {
    sub: String(m.id),
    role: 'machine',
    machineId: m.machineId,
  };
  const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
  res.status(200).json({ token });
};

app.post('/auth/technician/login', technicianLogin);
app.post('/auth/machine/login', machineLogin);

/** Minimal error handler */
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = (err as { status?: number }).status ?? 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(status).json({ message });
};
app.use(errorHandler);

app.listen(PORT, () => {
   
  console.log(`mock auth listening on :${PORT}`);
});
