import { Router } from 'express';
import authRoutes from './authRoutes';
import orderRoutes from './orderRoutes';
import zoneRoutes from './zoneRoutes';
import agentRoutes from './agentRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/orders', orderRoutes);
router.use('/zones', zoneRoutes);
router.use('/agents', agentRoutes);

export default router;
