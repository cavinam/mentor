import { Router } from 'express';
import { historyController } from '../controllers/history.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/history - Get all history (with filters)
router.get('/', historyController.getAll);

// GET /api/history/company-visits - Get company visits for a month
router.get('/company-visits', historyController.getCompanyVisits);

// GET /api/history/meeting/:meetingId - Get history for specific meeting
router.get('/meeting/:meetingId', historyController.getByMeeting);

// GET /api/history/user/:userId - Get history for specific user (ADMIN only)
router.get('/user/:userId', authorize('ADMIN'), historyController.getByUser);

export default router;
