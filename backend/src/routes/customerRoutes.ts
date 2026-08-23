import { Router } from 'express';
import { CustomerFeedbackController } from '../controllers/CustomerFeedbackController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth, requireRole([Role.CUSTOMER]));

router.get('/feedback/eligible', CustomerFeedbackController.getEligible);
router.post('/feedback', CustomerFeedbackController.submitFeedback);

export default router;
