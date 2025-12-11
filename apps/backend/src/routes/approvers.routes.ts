import { Router } from 'express';
import { ApproverController } from '../controllers/approver.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
const approverController = new ApproverController();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// GET /api/approvers - Get all department approvers
router.get('/', (req, res) => approverController.getAllApprovers(req, res));

// GET /api/approvers/potential - Get potential approvers (users with SECTION_HEAD or HRGA_MANAGER role)
router.get('/potential', (req, res) => approverController.getPotentialApprovers(req, res));

// GET /api/approvers/department/:departmentId - Get approvers by department
router.get('/department/:departmentId', (req, res) => approverController.getApproversByDepartment(req, res));

// POST /api/approvers - Add approver to department
router.post('/', (req, res) => approverController.addApprover(req, res));

// DELETE /api/approvers/:id - Remove approver from department
router.delete('/:id', (req, res) => approverController.removeApprover(req, res));

export default router;
