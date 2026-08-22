import { Request, Response, NextFunction } from 'express';
import { LifecycleService } from '../services/LifecycleService';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';
import { BadRequestError } from '../errors/DomainError';

const statusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  failureReason: z.string().optional()
});

export class LifecycleController {
  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: orderId } = req.params;
      const { status, failureReason } = statusSchema.parse(req.body);
      const actorId = ((req as any).user).userId;
      const actorRole = ((req as any).user).role;

      if (status === OrderStatus.FAILED && !failureReason) {
        throw new BadRequestError('failureReason is required when status is FAILED');
      }

      const result = await LifecycleService.updateStatus(orderId as string, actorId, status, actorRole, failureReason);
      
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async rescheduleOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: orderId } = req.params;
      const customerId = ((req as any).user).userId;

      const result = await LifecycleService.rescheduleOrder(orderId as string, customerId);
      
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
