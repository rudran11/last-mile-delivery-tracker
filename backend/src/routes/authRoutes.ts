import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.use(authLimiter);

router.post('/login', AuthController.login);
router.post('/register/init', AuthController.registerInit);
router.post('/register/verify', AuthController.registerVerify);
router.post('/register/resend', AuthController.registerResend);

export default router;
