import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof LoginSchema>;

export const MachineLoginSchema = z.object({
  machineId: z.string().min(1),
  apiKey: z.string().min(1),
});
export type MachineLoginBody = z.infer<typeof MachineLoginSchema>;
