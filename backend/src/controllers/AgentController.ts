import { Request, Response, NextFunction } from 'express';
import { AgentService } from '../services/AgentService';

export class AgentController {
  static async listAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const agents = await AgentService.getAllAgents();
      
      res.status(200).json({
        success: true,
        data: agents,
      });
    } catch (error) {
      next(error);
    }
  }
  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { isAvailable } = req.body;
      const userId = ((req as any).user).userId as string;
      const profile = await AgentService.updateStatus(userId, isAvailable);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
}
