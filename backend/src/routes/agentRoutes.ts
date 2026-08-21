import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', requireAuth, requireRole([Role.ADMIN]), AgentController.listAgents);

export default router;
