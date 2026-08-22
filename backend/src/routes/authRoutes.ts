import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register/init', AuthController.registerInit);
router.post('/register/verify', AuthController.registerVerify);
router.post('/register/resend', AuthController.registerResend);

export default router;
