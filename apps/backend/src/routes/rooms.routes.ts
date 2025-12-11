import { Router } from 'express';
import { roomController } from '../controllers/room.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { createRoomSchema, updateRoomSchema } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/rooms/stats - Get room statistics
router.get('/stats', roomController.getStats);

// GET /api/rooms - Get all meeting rooms
router.get('/', roomController.getAll);

// GET /api/rooms/availability - Check room availability (must be before /:id)
router.get('/availability', roomController.checkAvailability);

// GET /api/rooms/:id - Get room by ID
router.get('/:id', roomController.getById);

// POST /api/rooms - Create new room (ADMIN only)
router.post('/', authorize('ADMIN'), validate(createRoomSchema), roomController.create);

// PUT /api/rooms/:id - Update room (ADMIN only)
router.put('/:id', authorize('ADMIN'), validate(updateRoomSchema), roomController.update);

// DELETE /api/rooms/:id - Delete room (ADMIN only)
router.delete('/:id', authorize('ADMIN'), roomController.delete);

export default router;
