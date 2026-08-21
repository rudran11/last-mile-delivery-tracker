import { Router } from 'express';
import { ZoneController } from '../controllers/ZoneController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuth, ZoneController.listZones);

export default router;
