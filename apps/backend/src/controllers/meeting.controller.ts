import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { meetingService } from '../services/meeting.service';
import { CreateMeetingDTO } from '../types/api.types';

export const meetingController = {
  // GET /api/meetings
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 10, status, roomId, departmentId, startDate, endDate } = req.query;

      const result = await meetingService.getAll({
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        roomId: roomId as string,
        departmentId: departmentId as string,
        startDate: startDate as string,
        endDate: endDate as string,
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

  // GET /api/meetings/:id
  getById: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const meeting = await meetingService.getById(id);

      res.json({
        success: true,
        data: meeting,
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/meetings/my-bookings
  getMyBookings: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const meetings = await meetingService.getByUserId(userId!);

      res.json({
        success: true,
        data: meetings,
      });
    } catch (error) {
      throw error;
    }
  },

  // POST /api/meetings
  create: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const departmentId = req.user?.departmentId;

      const data = req.body as CreateMeetingDTO;
      const meeting = await meetingService.create({
        ...data,
        userId: userId!,
        departmentId: departmentId!,
      });

      res.status(201).json({
        success: true,
        data: meeting,
        message: 'Meeting booking created successfully',
      });
    } catch (error) {
      throw error;
    }
  },

  // PUT /api/meetings/:id
  update: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const meeting = await meetingService.update(id, data);

      res.json({
        success: true,
        data: meeting,
        message: 'Meeting booking updated successfully',
      });
    } catch (error) {
      throw error;
    }
  },

  // DELETE /api/meetings/:id
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      await meetingService.delete(id, userId!);

      res.json({
        success: true,
        message: 'Meeting booking deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  },

  // POST /api/meetings/:id/cancel
  cancel: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const userId = req.user?.id;

      await meetingService.cancel(id, userId!, remark);

      res.json({
        success: true,
        message: 'Meeting booking cancelled successfully',
      });
    } catch (error) {
      throw error;
    }
  },
};
