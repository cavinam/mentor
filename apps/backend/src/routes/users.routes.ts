import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { createUserSchema, updateUserSchema } from '../utils/validators';

const router = Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// GET /api/users/stats - Get user statistics
router.get('/stats', userController.getStats);

// GET /api/users - Get all users with pagination
router.get('/', userController.getAll);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getById);

// POST /api/users - Create new user
router.post('/', validate(createUserSchema), userController.create);

// PUT /api/users/:id - Update user
router.put('/:id', validate(updateUserSchema), userController.update);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.delete);

export default router;
