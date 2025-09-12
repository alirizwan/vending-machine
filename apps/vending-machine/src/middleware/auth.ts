import { type RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { type TokenPayload } from '../types/auth.js';

function isTokenPayload(payload: string | JwtPayload): payload is TokenPayload {
  // minimal structural check
  return typeof payload === 'object' && payload !== null
    && 'sub' in payload && 'role' in payload && 'username' in payload;
}

export const authenticate = (jwtSecret: string): RequestHandler => (req, res, next): void => {
  const header: string | undefined = req.header('authorization') ?? req.header('Authorization');
  const token: string | undefined = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (!isTokenPayload(decoded)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const requireMaintenance: RequestHandler = (req, res, next): void => {
  if (req.user?.role !== 'maintenance') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
};
