export type Role = 'customer' | 'maintenance';

export interface TokenPayload {
  sub: string;
  role: Role;
  username: string;
  iat?: number;
  exp?: number;
}
