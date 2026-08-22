import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { loginSchema, registerSchema } from '../validators/authValidators';

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

  static async registerInit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.registerInit(data);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async registerVerify(req: Request, res: Response, next: NextFunction) {
    try {
      const { otpVerifySchema } = await import('../validators/authValidators');
      const data = otpVerifySchema.parse(req.body);
      const result = await AuthService.registerVerify(data);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async registerResend(req: Request, res: Response, next: NextFunction) {
    try {
      const { otpResendSchema } = await import('../validators/authValidators');
      const data = otpResendSchema.parse(req.body);
      const result = await AuthService.registerResend(data);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
