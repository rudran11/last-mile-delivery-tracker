import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { loginSchema } from '../validators/authValidators';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
