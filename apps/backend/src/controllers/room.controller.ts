import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { roomService } from '../services/room.service';
import { CreateRoomDTO } from '../types/api.types';
import { prisma } from '../config/database';

export const roomController = {
  // GET /api/rooms/stats
  getStats: async (_req: AuthRequest, res: Response) => {
    try {
      const total = await prisma.meetingRoom.count();

      // For now, we'll set available = total (can be enhanced later)
      const stats = {
        total,
        available: total,
        inUseToday: 0, // Can be calculated based on today's meetings
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/rooms
  getAll: async (_req: AuthRequest, res: Response) => {
    try {
      const rooms = await roomService.getAll();

      res.json({
        success: true,
        data: rooms,
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/rooms/:id
  getById: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const room = await roomService.getById(id);

      res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/rooms/availability
  checkAvailability: async (req: AuthRequest, res: Response) => {
    try {
      const { roomId, startDate, endDate, startTime, endTime, excludeMeetingId } = req.query;

      const result = await roomService.checkAvailability({
        roomId: roomId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        startTime: startTime as string,
        endTime: endTime as string,
        excludeMeetingId: excludeMeetingId as string | undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw error;
    }
  },

  // POST /api/rooms
  create: async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body as CreateRoomDTO;
      const room = await roomService.create(data);

      res.status(201).json({
        success: true,
        data: room,
        message: 'Meeting room created successfully',
      });
    } catch (error) {
      throw error;
    }
  },

  // PUT /api/rooms/:id
  update: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const room = await roomService.update(id, data);

      res.json({
        success: true,
        data: room,
        message: 'Meeting room updated successfully',
      });
    } catch (error) {
      throw error;
    }
  },

  // DELETE /api/rooms/:id
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await roomService.delete(id);

      res.json({
        success: true,
        message: 'Meeting room deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  },
};
