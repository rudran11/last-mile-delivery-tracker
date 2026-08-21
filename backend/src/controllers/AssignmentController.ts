import { Request, Response, NextFunction } from 'express';
import { AssignmentService } from '../services/AssignmentService';

export class AssignmentController {
  static async assignAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: orderId } = req.params;
      const actorId = (req.user as any).userId; // Can be Admin doing manual assignment

      const result = await AssignmentService.assignAgent(orderId as string, actorId as string);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
  static async reassignAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: orderId } = req.params;
      const { agentId: targetAgentId } = req.body;
      const actorId = (req.user as any).userId;

      if (!targetAgentId) {
        throw new Error('agentId is required');
      }

      const result = await AssignmentService.manualReassign(orderId as string, targetAgentId as string, actorId as string);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
