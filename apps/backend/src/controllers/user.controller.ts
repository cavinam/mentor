import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { userService } from '../services/user.service';
import { CreateUserDTO, UpdateUserDTO } from '../types/api.types';

export const userController = {
  // GET /api/users
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 10, search, role, departmentId } = req.query;

      const result = await userService.getAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        role: role as string,
        departmentId: departmentId as string,
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

  // GET /api/users/:id
  getById: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userService.getById(id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      throw error;
    }
  },

  // POST /api/users
  create: async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body as CreateUserDTO;
      const user = await userService.create(data);

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      throw error;
    }
  },

  // PUT /api/users/:id
  update: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body as UpdateUserDTO;
      const user = await userService.update(id, data);

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully',
      });
    } catch (error) {
      throw error;
    }
  },

  // DELETE /api/users/:id
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await userService.delete(id);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      res.status(400).json({
        success: false,
        message,
      });
    }
  },

  // GET /api/users/stats
  getStats: async (_req: AuthRequest, res: Response) => {
    try {
      const stats = await userService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      throw error;
    }
  },
};
