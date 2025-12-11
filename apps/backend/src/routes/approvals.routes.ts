import { Router, IRouter } from 'express';
import { approvalController } from '../controllers/approval.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { approveActionSchema, rejectActionSchema } from '../utils/validators';

const router: IRouter = Router();

// All routes require authentication and must be ADMIN, SECTION_HEAD, or HRGA_MANAGER
router.use(authenticate);
router.use(authorize('ADMIN', 'SECTION_HEAD', 'HRGA_MANAGER'));

// GET /api/approvals/pending - Get pending approvals for current user
router.get('/pending', approvalController.getPendingApprovals);

// GET /api/approvals/history - Get approval history
router.get('/history', approvalController.getApprovalHistory);

// GET /api/approvals/meeting/:meetingId - Get approval status for a meeting
router.get('/meeting/:meetingId', approvalController.getMeetingApprovals);

// POST /api/approvals/:meetingId/approve - Approve a meeting
router.post('/:meetingId/approve', validate(approveActionSchema), approvalController.approve);

// POST /api/approvals/:meetingId/reject - Reject a meeting
router.post('/:meetingId/reject', validate(rejectActionSchema), approvalController.reject);

export default router;
