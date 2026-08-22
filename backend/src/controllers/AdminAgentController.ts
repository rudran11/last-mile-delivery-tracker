import { Request, Response, NextFunction } from 'express';
import { AdminAgentService } from '../services/AdminAgentService';
import { createAgentSchema, updateAgentSchema } from '../validators/agentValidators';

export class AdminAgentController {
  static async getAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const agents = await AdminAgentService.getAgents();
      res.status(200).json({ success: true, data: agents });
    } catch (error) {
      next(error);
    }
  }

  static async createAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createAgentSchema.parse(req.body);
      const result = await AdminAgentService.createAgent(data);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = updateAgentSchema.parse(req.body);
      const result = await AdminAgentService.updateAgent(id, data);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deactivateAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await AdminAgentService.deactivateAgent(id);
      res.status(200).json({ success: true, message: 'Agent deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
