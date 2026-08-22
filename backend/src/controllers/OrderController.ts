import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';
import { createOrderSchema } from '../validators/orderValidators';
import { BadRequestError } from '../errors/DomainError';

export class OrderController {
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string;
      if (!idempotencyKey) {
        throw new BadRequestError('Idempotency-Key header is required');
      }

      const data = createOrderSchema.parse(req.body);
      const customerId = (req as any).user.userId as string;

      const order = await OrderService.createOrder(customerId, data, idempotencyKey);
      
      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createOrderSchema.parse(req.body);
      const quote = await OrderService.getQuote(data);
      
      res.status(200).json({
        success: true,
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  static async rescheduleOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const customerId = (req as any).user.userId as string;
      const { scheduledDate } = req.body;
      const parsedDate = scheduledDate ? new Date(scheduledDate) : undefined;
      
      const { LifecycleService } = await import('../services/LifecycleService');
      const result = await LifecycleService.rescheduleOrder(id, customerId, parsedDate);

      // Trigger assignment since status is PENDING
      const { AssignmentService } = await import('../services/AssignmentService');
      AssignmentService.assignAgent(result.order.id, customerId, result.scheduledDate).catch(err => console.error('Reassignment failed', err));

      res.status(200).json({
        success: true,
        data: result.order,
      });
    } catch (error) {
      next(error);
    }
  }
}
