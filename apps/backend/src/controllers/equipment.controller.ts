import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { equipmentService } from '../services/equipment.service';
import { CreateEquipmentDTO } from '../types/api.types';
import { prisma } from '../config/database';

export const equipmentController = {
  // GET /api/equipment/stats
  getStats: async (_req: AuthRequest, res: Response) => {
    try {
      const totalEquipment = await prisma.equipment.count();

      const stats = {
        total: totalEquipment,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/equipment
  getAll: async (_req: AuthRequest, res: Response) => {
    try {
      const equipment = await equipmentService.getAll();

      res.json({
        success: true,
        data: equipment,
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/equipment/:id
  getById: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const equipment = await equipmentService.getById(id);

      res.json({
        success: true,
        data: equipment,
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/equipment/availability
  checkAvailability: async (req: AuthRequest, res: Response) => {
    try {
      const { equipmentId, startDate, endDate } = req.query;
      
      const availability = await equipmentService.checkAvailability({
        equipmentId: equipmentId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.json({
        success: true,
        data: availability,
      });
    } catch (error) {
      throw error;
    }
  },

  // POST /api/equipment
  create: async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body as CreateEquipmentDTO;
      const equipment = await equipmentService.create(data);

      res.status(201).json({
        success: true,
        data: equipment,
        message: 'Equipment created successfully',
      });
    } catch (error) {
      throw error;
    }
  },

  // PUT /api/equipment/:id
  update: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const equipment = await equipmentService.update(id, data);

      res.json({
        success: true,
        data: equipment,
        message: 'Equipment updated successfully',
      });
    } catch (error) {
      throw error;
    }
  },

  // DELETE /api/equipment/:id
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await equipmentService.delete(id);

      res.json({
        success: true,
        message: 'Equipment deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  },
};
