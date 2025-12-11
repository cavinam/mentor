import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { departmentService } from '../services/department.service';
import { CreateDepartmentDTO } from '../types/api.types';

export const departmentController = {
  // GET /api/departments
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const departments = await departmentService.getAll();

      res.json({
        success: true,
        data: departments,
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/departments/:id
  getById: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const department = await departmentService.getById(id);

      res.json({
        success: true,
        data: department,
      });
    } catch (error) {
      throw error;
    }
  },

  // POST /api/departments
  create: async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body as CreateDepartmentDTO;
      const department = await departmentService.create(data);

      res.status(201).json({
        success: true,
        data: department,
        message: 'Department created successfully',
      });
    } catch (error) {
      throw error;
    }
  },

  // PUT /api/departments/:id
  update: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const department = await departmentService.update(id, data);

      res.json({
        success: true,
        data: department,
        message: 'Department updated successfully',
      });
    } catch (error) {
      throw error;
    }
  },

  // DELETE /api/departments/:id
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await departmentService.delete(id);

      res.json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  },
};
