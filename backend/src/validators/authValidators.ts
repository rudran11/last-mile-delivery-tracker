import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  role: z.literal('CUSTOMER').optional().or(z.undefined()),
}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
