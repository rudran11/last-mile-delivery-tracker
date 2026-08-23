import { Request, Response, NextFunction } from 'express';
import { AdminPerformanceService } from '../services/AdminPerformanceService';

export class AdminPerformanceController {
  static async getAgentPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await AdminPerformanceService.getAgentPerformance(id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
