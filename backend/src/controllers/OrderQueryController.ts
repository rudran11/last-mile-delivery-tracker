import { Request, Response, NextFunction } from 'express';
import { OrderQueryService } from '../services/OrderQueryService';

export class OrderQueryController {
  static async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, role } = (req as any).user;
      const filters = {
        status: req.query.status as string,
        zoneId: req.query.zoneId as string,
        agentId: req.query.agentId as string,
      };
      const result = await OrderQueryService.listOrders(userId, role, filters);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: orderId } = req.params;
      const { userId, role } = (req as any).user;
      const result = await OrderQueryService.getOrderById(orderId as string, userId, role);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: orderId } = req.params;
      const { userId, role } = (req as any).user;
      const result = await OrderQueryService.getTracking(orderId as string, userId, role);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
