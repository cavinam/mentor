import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { authService } from '../services/auth.service';
import { LoginDTO } from '../types/api.types';

export const authController = {
  // POST /api/auth/login
  login: async (req: AuthRequest, res: Response) => {
    try {
      const { email, password } = req.body as LoginDTO;
      
      const result = await authService.login(email, password);
      
      res.json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      throw error;
    }
  },

  // POST /api/auth/logout
  logout: async (req: AuthRequest, res: Response) => {
    try {
      // Logout is handled on client side by removing token
      // Here we can add token blacklist logic if needed
      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      throw error;
    }
  },

  // GET /api/auth/me
  me: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }
      
      const user = await authService.getCurrentUser(userId);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      throw error;
    }
  },
};
