import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';
import { AdminConfigurationController } from '../controllers/AdminConfigurationController';
import { NotificationController } from '../controllers/NotificationController';

const router = Router();

// All routes require ADMIN role
router.use(requireAuth);
router.use(requireRole([Role.ADMIN]));

// Zones
router.get('/zones', AdminConfigurationController.getZones);
router.post('/zones', AdminConfigurationController.createZone);
router.put('/zones/:id', AdminConfigurationController.updateZone);

// Areas
router.get('/areas', AdminConfigurationController.getAreas);
router.post('/areas', AdminConfigurationController.createArea);
router.put('/areas/:id', AdminConfigurationController.updateArea);

// Rates
router.get('/rates', AdminConfigurationController.getRateConfigurations);
router.post('/rates', AdminConfigurationController.createRateConfiguration);
router.put('/rates/:id', AdminConfigurationController.updateRateConfiguration);

// Orders
router.post('/orders', AdminConfigurationController.createOrder);
router.post('/orders/:id/override-status', AdminConfigurationController.overrideOrderStatus);

// Notifications
router.get('/notifications', NotificationController.getNotifications);

// Customers
router.get('/customers', AdminConfigurationController.getCustomers);

export default router;
