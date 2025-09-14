import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import type { TokenPayload } from '../types/auth';

function isTokenPayload(payload: string | JwtPayload): payload is TokenPayload {
  return typeof payload === 'object' && payload !== null && 'role' in payload && 'sub' in payload;
}

export const authenticate = (jwtSecret: string): RequestHandler => (req, res, next) => {
  const header = req.header('authorization') ?? req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: 'Unauthorized: missing bearer token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (!isTokenPayload(decoded)) {
      res.status(401).json({ message: 'Unauthorized: invalid token payload' });
      return;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized: token verification failed' });
  }
};

export const requireTechnician: RequestHandler = (req, res, next) => {
  if (req.user?.role !== 'technician') {
    res.status(403).json({ message: 'Forbidden: technician role required' });
    return;
  }
  next();
};

export const requireMachine: RequestHandler = (req, res, next) => {
  if (req.user?.role !== 'machine') {
    res.status(403).json({ message: 'Forbidden: machine role required' });
    return;
  }
  next();
};
