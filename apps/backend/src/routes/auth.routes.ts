import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { loginSchema } from '../utils/validators';

const router = Router();

// POST /api/auth/login - Login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/logout - Logout (optional endpoint, client-side is enough)
router.post('/logout', authController.logout);

// GET /api/auth/me - Get current user
router.get('/me', authenticate, authController.me);

export default router;
