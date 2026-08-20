import { z } from 'zod';
import { OrderType, PaymentType } from '@prisma/client';

export const createOrderSchema = z.object({
  pickupAddress: z.string().min(5),
  dropAddress: z.string().min(5),
  pickupZoneId: z.string().uuid(),
  dropZoneId: z.string().uuid(),
  length: z.number().positive(),
  breadth: z.number().positive(),
  height: z.number().positive(),
  actualWeight: z.number().positive(),
  orderType: z.nativeEnum(OrderType),
  paymentType: z.nativeEnum(PaymentType),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
