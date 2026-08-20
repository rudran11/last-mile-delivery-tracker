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
      const customerId = req.user!.userId;

      const order = await OrderService.createOrder(customerId, data, idempotencyKey);
      
      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}
