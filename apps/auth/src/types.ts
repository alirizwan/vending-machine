export type Role = 'technician' | 'machine';

export interface TechnicianTokenPayload {
  sub: string;
  role: 'technician';
  username: string;
  iat?: number;
  exp?: number;
}

export interface MachineTokenPayload {
  sub: string;
  role: 'machine';
  machineId: string;
  iat?: number;
  exp?: number;
}

export interface Technician {
  id: number;
  username: string;
  password: string; // plaintext for mock only
}

export interface Machine {
  id: number;
  name: string;
  machineId: string;
  apiKey: string; // plaintext for mock only
}
