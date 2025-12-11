import { prisma } from '../config/database';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
// import { AppError } from '../middlewares/errorHandler';

export const authService = {
  login: async (email: string, password: string) => {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true },
    });

    if (!user) {
      // throw new AppError(401, 'Invalid credentials');
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      // throw new AppError(401, 'Invalid credentials');
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      userId: user.userId,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || undefined,
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  },

  getCurrentUser: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userId: true,
        email: true,
        fullName: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      // throw new AppError(404, 'User not found');
      throw new Error('User not found');
    }

    return user;
  },
};
