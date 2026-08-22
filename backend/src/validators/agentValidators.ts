import { z } from 'zod';

export const createAgentSchema = z.object({
  name: z.string().min(2).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isAvailable: z.boolean().default(true),
}).strict();

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

export const updateAgentSchema = z.object({
  name: z.string().min(2).trim(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isAvailable: z.boolean(),
}).strict();

export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
