import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './users.routes';
import departmentRoutes from './departments.routes';
import roomRoutes from './rooms.routes';
import equipmentRoutes from './equipment.routes';
import meetingRoutes from './meetings.routes';
import approvalRoutes from './approvals.routes';
import approverRoutes from './approvers.routes';
import historyRoutes from './history.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/rooms', roomRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/meetings', meetingRoutes);
router.use('/approvals', approvalRoutes);
router.use('/approvers', approverRoutes);
router.use('/history', historyRoutes);

export default router;
