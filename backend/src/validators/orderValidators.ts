import { z } from 'zod';
import { OrderType, PaymentType } from '@prisma/client';

export const createOrderSchema = z.object({
  pickupAddress: z.string().min(5),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  pickupPincode: z.string().optional(),
  dropAddress: z.string().min(5),
  dropLat: z.number().min(-90).max(90),
  dropLng: z.number().min(-180).max(180),
  dropPincode: z.string().optional(),
  length: z.number().positive(),
  breadth: z.number().positive(),
  height: z.number().positive(),
  actualWeight: z.number().positive(),
  orderType: z.nativeEnum(OrderType),
  paymentType: z.nativeEnum(PaymentType),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const reassignOrderSchema = z.object({
  agentId: z.string().uuid(),
});

export type ReassignOrderInput = z.infer<typeof reassignOrderSchema>;
