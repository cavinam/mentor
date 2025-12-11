import { Router } from 'express';
import { departmentController } from '../controllers/department.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { createDepartmentSchema, updateDepartmentSchema } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/departments - Get all departments
router.get('/', departmentController.getAll);

// GET /api/departments/:id - Get department by ID
router.get('/:id', departmentController.getById);

// POST /api/departments - Create new department (ADMIN only)
router.post('/', authorize('ADMIN'), validate(createDepartmentSchema), departmentController.create);

// PUT /api/departments/:id - Update department (ADMIN only)
router.put('/:id', authorize('ADMIN'), validate(updateDepartmentSchema), departmentController.update);

// DELETE /api/departments/:id - Delete department (ADMIN only)
router.delete('/:id', authorize('ADMIN'), departmentController.delete);

export default router;
