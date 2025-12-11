import { Router } from 'express';
import { meetingController } from '../controllers/meeting.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/meetings/my-bookings - Get current user's bookings (must come before /:id)
router.get('/my-bookings', meetingController.getMyBookings);

// GET /api/meetings - Get all meetings (with filters)
router.get('/', meetingController.getAll);

// GET /api/meetings/:id - Get meeting by ID
router.get('/:id', meetingController.getById);

// POST /api/meetings - Create new meeting
router.post('/', meetingController.create);

// PUT /api/meetings/:id - Update meeting
router.put('/:id', meetingController.update);

// DELETE /api/meetings/:id - Cancel/Delete meeting
router.delete('/:id', meetingController.delete);

// POST /api/meetings/:id/cancel - Cancel meeting
router.post('/:id/cancel', meetingController.cancel);

export default router;
