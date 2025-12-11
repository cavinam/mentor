import { Request, Response } from 'express';
import { ApproverService } from '../services/approver.service';
import { UserRole } from '@prisma/client';

const approverService = new ApproverService();

export class ApproverController {
  // GET /api/approvers - Get all department approvers
  async getAllApprovers(req: Request, res: Response) {
    try {
      const approvers = await approverService.getAllApprovers();
      res.json({
        success: true,
        data: approvers,
      });
    } catch (error) {
      console.error('Error fetching approvers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch approvers',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /api/approvers/department/:departmentId - Get approvers by department
  async getApproversByDepartment(req: Request, res: Response) {
    try {
      const { departmentId } = req.params;
      const approvers = await approverService.getApproversByDepartment(departmentId);
      res.json({
        success: true,
        data: approvers,
      });
    } catch (error) {
      console.error('Error fetching department approvers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department approvers',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /api/approvers/potential - Get potential approvers
  async getPotentialApprovers(req: Request, res: Response) {
    try {
      const users = await approverService.getPotentialApprovers();
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('Error fetching potential approvers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch potential approvers',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /api/approvers - Add approver to department
  async addApprover(req: Request, res: Response) {
    try {
      const { departmentId, userId, approverRole } = req.body;

      if (!departmentId || !userId || !approverRole) {
        return res.status(400).json({
          success: false,
          message: 'departmentId, userId, and approverRole are required',
        });
      }

      const approver = await approverService.addApprover(
        departmentId,
        userId,
        approverRole as UserRole
      );

      res.status(201).json({
        success: true,
        message: 'Approver added successfully',
        data: approver,
      });
    } catch (error) {
      console.error('Error adding approver:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to add approver',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // DELETE /api/approvers/:id - Remove approver
  async removeApprover(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await approverService.removeApprover(id);
      res.json({
        success: true,
        message: 'Approver removed successfully',
      });
    } catch (error) {
      console.error('Error removing approver:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to remove approver',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
