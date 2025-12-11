import { Router } from 'express';
import { equipmentController } from '../controllers/equipment.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { createEquipmentSchema, updateEquipmentSchema } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/equipment/stats - Get equipment statistics
router.get('/stats', equipmentController.getStats);

// GET /api/equipment - Get all equipment
router.get('/', equipmentController.getAll);

// GET /api/equipment/availability - Check equipment availability (must be before /:id)
router.get('/availability', equipmentController.checkAvailability);

// GET /api/equipment/:id - Get equipment by ID
router.get('/:id', equipmentController.getById);

// POST /api/equipment - Create new equipment (ADMIN only)
router.post('/', authorize('ADMIN'), validate(createEquipmentSchema), equipmentController.create);

// PUT /api/equipment/:id - Update equipment (ADMIN only)
router.put('/:id', authorize('ADMIN'), validate(updateEquipmentSchema), equipmentController.update);

// DELETE /api/equipment/:id - Delete equipment (ADMIN only)
router.delete('/:id', authorize('ADMIN'), equipmentController.delete);

export default router;
