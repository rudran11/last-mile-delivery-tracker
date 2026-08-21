import { Request, Response, NextFunction } from 'express';
import { ZoneService } from '../services/ZoneService';

export class ZoneController {
  static async listZones(req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await ZoneService.getAllZones();
      
      res.status(200).json({
        success: true,
        data: zones,
      });
    } catch (error) {
      next(error);
    }
  }
}
