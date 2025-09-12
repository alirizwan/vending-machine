export type Role = 'technician' | 'machine';

export interface TechnicianTokenPayload {
  sub: string;
  role: 'technician';
  username: string;
  iat?: number; exp?: number;
}

export interface MachineTokenPayload {
  sub: string;
  role: 'machine';
  machineId: string;
  iat?: number; exp?: number;
}

export type TokenPayload = TechnicianTokenPayload | MachineTokenPayload;
