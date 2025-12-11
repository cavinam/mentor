import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { approvalService } from '../services/approval.service';

export const approvalController = {
  // GET /api/approvals/pending
  getPendingApprovals: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const departmentId = req.user?.departmentId;
      
      const approvals = await approvalService.getPendingForUser(userId!, userRole!, departmentId);

      res.json({
        success: true,
        data: approvals,
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/approvals/history
  getApprovalHistory: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const departmentId = req.user?.departmentId;
      const { page = 1, limit = 10 } = req.query;
      
      const result = await approvalService.getHistoryForUser(userId!, userRole!, departmentId, {
        page: Number(page),
        limit: Number(limit),
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/approvals/meeting/:meetingId
  getMeetingApprovals: async (req: AuthRequest, res: Response) => {
    try {
      const { meetingId } = req.params;
      const approvals = await approvalService.getByMeetingId(meetingId);

      res.json({
        success: true,
        data: approvals,
      });
    } catch (error) {
      throw error;
    }
  },

  // POST /api/approvals/:meetingId/approve
  approve: async (req: AuthRequest, res: Response) => {
    try {
      const { meetingId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { remark } = req.body;
      
      const result = await approvalService.approve(meetingId, userId!, userRole!, remark);

      res.json({
        success: true,
        data: result,
        message: 'Meeting approved successfully',
      });
    } catch (error) {
      throw error;
    }
  },

  // POST /api/approvals/:meetingId/reject
  reject: async (req: AuthRequest, res: Response) => {
    try {
      const { meetingId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { remark } = req.body;
      
      const result = await approvalService.reject(meetingId, userId!, userRole!, remark);

      res.json({
        success: true,
        data: result,
        message: 'Meeting rejected',
      });
    } catch (error) {
      throw error;
    }
  },
};
