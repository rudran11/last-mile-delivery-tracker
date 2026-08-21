import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { AssignmentController } from '../controllers/AssignmentController';
import { LifecycleController } from '../controllers/LifecycleController';
import { OrderQueryController } from '../controllers/OrderQueryController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.post('/', requireAuth, requireRole([Role.CUSTOMER]), OrderController.createOrder);
router.post('/quote', requireAuth, requireRole([Role.CUSTOMER, Role.ADMIN]), OrderController.getQuote);
router.post('/:id/assign', requireAuth, requireRole([Role.ADMIN]), AssignmentController.assignAgent);
router.post('/:id/reassign', requireAuth, requireRole([Role.ADMIN]), AssignmentController.reassignAgent);
router.patch('/:id/status', requireAuth, requireRole([Role.AGENT, Role.ADMIN]), LifecycleController.updateStatus);
router.post('/:id/reschedule', requireAuth, requireRole([Role.CUSTOMER]), LifecycleController.rescheduleOrder);

router.get('/', requireAuth, OrderQueryController.listOrders);
router.get('/:id', requireAuth, OrderQueryController.getOrderById);
router.get('/:id/tracking', requireAuth, OrderQueryController.getTracking);
router.post('/:id/reschedule', OrderController.rescheduleOrder);

export default router;
