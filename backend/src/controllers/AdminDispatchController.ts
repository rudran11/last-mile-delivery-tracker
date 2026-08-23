import { Request, Response, NextFunction } from 'express';
import { AdminDispatchService } from '../services/AdminDispatchService';

export class AdminDispatchController {
  static async getDispatchExplanation(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id as string;
      const data = await AdminDispatchService.getDispatchExplanation(orderId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
