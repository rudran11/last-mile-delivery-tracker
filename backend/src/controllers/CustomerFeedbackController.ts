import { Request, Response, NextFunction } from 'express';
import { CustomerFeedbackService } from '../services/CustomerFeedbackService';
import { createFeedbackSchema } from '../validators/feedbackValidators';

export class CustomerFeedbackController {
  static async getEligible(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).user.userId;
      const order = await CustomerFeedbackService.getEligibleFeedbackOrder(customerId);
      res.json({ eligibleOrder: order });
    } catch (error) {
      next(error);
    }
  }

  static async submitFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).user.userId;
      const validatedData = createFeedbackSchema.parse(req.body);
      const feedback = await CustomerFeedbackService.createFeedback(customerId, validatedData);
      res.status(201).json({ success: true, feedback });
    } catch (error) {
      next(error);
    }
  }
}
