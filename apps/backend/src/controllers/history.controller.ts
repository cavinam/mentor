import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { historyService } from '../services/history.service';

export const historyController = {
  // GET /api/history
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 10, userId, meetingId, action } = req.query;

      const result = await historyService.getAll({
        page: Number(page),
        limit: Number(limit),
        userId: userId as string,
        meetingId: meetingId as string,
        action: action as string,
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

  // GET /api/history/meeting/:meetingId
  getByMeeting: async (req: AuthRequest, res: Response) => {
    try {
      const { meetingId } = req.params;
      const history = await historyService.getByMeetingId(meetingId);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/history/user/:userId
  getByUser: async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const history = await historyService.getByUserId(userId);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/history/company-visits
  getCompanyVisits: async (req: AuthRequest, res: Response) => {
    try {
      const { month, year, companyName, page = 1, limit = 50 } = req.query;

      // Default to current month/year if not provided
      const now = new Date();
      const targetMonth = month ? Number(month) : now.getMonth() + 1;
      const targetYear = year ? Number(year) : now.getFullYear();

      const result = await historyService.getCompanyVisits({
        month: targetMonth,
        year: targetYear,
        companyName: companyName as string | undefined,
        page: Number(page),
        limit: Number(limit),
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      throw error;
    }
  },
};
