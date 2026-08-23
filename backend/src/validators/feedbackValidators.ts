import { z } from 'zod';

export const createFeedbackSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
}).strict();

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
