import { Request, Response, NextFunction } from 'express';
import { ZoneService } from '../services/ZoneService';
import { PricingService } from '../services/PricingService';

export class AdminConfigurationController {
  // Zones
  static async getZones(req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await ZoneService.getAllZones();
      res.json({ success: true, data: zones });
    } catch (error) { next(error); }
  }

  static async createZone(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, isActive } = req.body;
      const zone = await ZoneService.createZone(name, isActive);
      res.status(201).json({ success: true, data: zone });
    } catch (error) { next(error); }
  }

  static async updateZone(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { name, isActive } = req.body;
      const zone = await ZoneService.updateZone(id, name, isActive);
      res.json({ success: true, data: zone });
    } catch (error) { next(error); }
  }

  // Areas
  static async getAreas(req: Request, res: Response, next: NextFunction) {
    try {
      const areas = await ZoneService.getAllAreas();
      res.json({ success: true, data: areas });
    } catch (error) { next(error); }
  }

  static async createArea(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, pincode, zoneId, isActive } = req.body;
      const area = await ZoneService.createArea(name, pincode, zoneId, isActive);
      res.status(201).json({ success: true, data: area });
    } catch (error) { next(error); }
  }

  static async updateArea(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { name, pincode, zoneId, isActive } = req.body;
      const area = await ZoneService.updateArea(id, name, pincode, zoneId, isActive);
      res.json({ success: true, data: area });
    } catch (error) { next(error); }
  }

  // Rates
  static async getRateConfigurations(req: Request, res: Response, next: NextFunction) {
    try {
      const rates = await PricingService.getRateConfigurations();
      res.json({ success: true, data: rates });
    } catch (error) { next(error); }
  }

  static async createRateConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const rate = await PricingService.createRateConfiguration(req.body);
      res.status(201).json({ success: true, data: rate });
    } catch (error) { next(error); }
  }

  static async updateRateConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;
      const rate = await PricingService.updateRateConfiguration(id, isActive);
      res.json({ success: true, data: rate });
    } catch (error) { next(error); }
  }

  // Admin Orders
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string;
      if (!idempotencyKey) throw new Error('Idempotency-Key header is required');
      const { customerId, ...orderData } = req.body;
      if (!customerId) throw new Error('customerId is required');

      // The createOrder method is exported from OrderService
      // Import it dynamically or statically at top
      const { OrderService } = await import('../services/OrderService');
      const { createOrderSchema } = await import('../validators/orderValidators');
      const data = createOrderSchema.parse(orderData);
      
      const order = await OrderService.createOrder(customerId, data, idempotencyKey);
      res.status(201).json({ success: true, data: order });
    } catch (error) { next(error); }
  }

  static async overrideOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const adminId = ((req as any).user).userId as string;
      
      const { OrderService } = await import('../services/OrderService');
      const order = await OrderService.overrideStatus(id, status, adminId);
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  }

  // Customers
  static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const customers = await prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: { id: true, name: true, email: true }
      });
      res.json({ success: true, data: customers });
    } catch (error) { next(error); }
  }
}
