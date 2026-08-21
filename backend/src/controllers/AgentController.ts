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
}
